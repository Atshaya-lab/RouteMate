import 'package:flutter_test/flutter_test.dart';
import 'package:routemate_flutter/core/offline_navigation/routing_graph.dart';
import 'package:routemate_flutter/core/offline_navigation/safety_evaluator.dart';
import 'package:routemate_flutter/core/offline_navigation/bidirectional_astar.dart';
import 'package:routemate_flutter/core/offline_navigation/dynamic_rerouter.dart';
import 'package:routemate_flutter/core/offline_navigation/campus_offline_graph.dart';

void main() {
  group('Offline Navigation Engine & Safety Route Planning', () {
    late RoutingGraph graph;
    late SafetyEvaluator evaluator;
    late BidirectionalAStar astar;

    setUp(() {
      graph = CampusOfflineGraphBuilder.buildDefaultGraph();
      evaluator = const SafetyEvaluator(
        config: SafetyConstraintConfig(
          avoidUnlitPaths: true,
          avoidIsolatedConstruction: true,
          requirePedestrianAccess: true,
          blockRestrictedZones: true,
          minimumDataConfidence: 0.7,
        ),
      );
      astar = BidirectionalAStar(graph: graph, safetyEvaluator: evaluator);
    });

    test('Bidirectional A* finds optimal well-lit safe route from Main Gate to North Hostels', () {
      final result = astar.findSafeRoute(
        sourceNodeId: 'node_main_gate',
        targetNodeId: 'node_north_hostels',
      );

      expect(result.status, equals('optimal_safe'));
      expect(result.path.isNotEmpty, isTrue);
      expect(result.path.first.id, equals('node_main_gate'));
      expect(result.path.last.id, equals('node_north_hostels'));

      // Should prefer the well-lit Library Avenue over the Dark Alleyway
      final nodeIds = result.path.map((n) => n.id).toList();
      expect(nodeIds, contains('node_library_quad'));
      expect(nodeIds, isNot(contains('node_dark_alley')));
      expect(nodeIds, isNot(contains('node_construction_zone')));

      // Safety score should be high for well-lit path
      expect(result.safetyScore, greaterThan(0.85));
    });

    test('Safety-Aware Route Planning avoids isolated construction zones', () {
      // Construction zone is directly linked to Main Gate, but evaluator must filter it out
      final result = astar.findSafeRoute(
        sourceNodeId: 'node_main_gate',
        targetNodeId: 'node_construction_zone',
      );

      // Path cannot enter construction zone due to hard safety constraints
      expect(result.status, equals('no_path_found'));
      expect(result.avoidedHazards.any((h) => h.contains('construction')), isTrue);
    });

    test('Safety Evaluator issues explicit uncertainty warnings for low-confidence edges', () {
      // Create a test evaluator that allows unlit paths to test uncertainty emission
      final permissiveEvaluator = const SafetyEvaluator(
        config: SafetyConstraintConfig(
          avoidUnlitPaths: false,
          minimumDataConfidence: 0.7,
        ),
      );

      final permissiveAstar = BidirectionalAStar(
        graph: graph,
        safetyEvaluator: permissiveEvaluator,
      );

      final result = permissiveAstar.findSafeRoute(
        sourceNodeId: 'node_admin_block',
        targetNodeId: 'node_dark_alley',
      );

      expect(result.path.isNotEmpty, isTrue);
      // Low data confidence on edge_admin_dark_alley (0.45 < 0.7) must trigger warning
      expect(result.uncertaintyWarnings.isNotEmpty, isTrue);
      expect(
        result.uncertaintyWarnings.first,
        contains('low telemetry confidence'),
      );
    });

    test('Dynamic Re-routing: Recalculates route locally when main path is blocked', () {
      // Initial route uses Main Gate -> Admin -> Library Quad -> North Hostels
      final initialResult = astar.findSafeRoute(
        sourceNodeId: 'node_main_gate',
        targetNodeId: 'node_north_hostels',
      );
      final initialNodeIds = initialResult.path.map((n) => n.id).toList();
      expect(initialNodeIds, contains('node_library_quad'));

      // Now simulate sudden obstacle/blockage on Library Avenue (e.g. fallen tree, flooding, protest)
      final rerouter = DynamicRerouter(graph: graph, safetyEvaluator: evaluator);

      final reroutedResult = rerouter.reportPathBlockedAndReroute(
        edgeId: 'edge_admin_library',
        reason: 'Downed power line / pathway flooding',
        currentSourceNodeId: 'node_main_gate',
        targetNodeId: 'node_north_hostels',
      );

      expect(reroutedResult.status, equals('optimal_safe'));
      expect(reroutedResult.isDynamicReroute, isTrue);

      final reroutedNodeIds = reroutedResult.path.map((n) => n.id).toList();

      // The new route MUST NOT use the blocked Library Quad
      expect(reroutedNodeIds, isNot(contains('node_library_quad')));

      // Instead, it should dynamically detour via the verified Safe Havens: Health Center & Police Outpost!
      expect(reroutedNodeIds, contains('node_health_center'));
      expect(reroutedNodeIds, contains('node_police_booth'));
      expect(reroutedResult.path.last.id, equals('node_north_hostels'));

      // Check rerouter records the report
      expect(rerouter.blockedReports.length, equals(1));
      expect(rerouter.blockedReports.first.reason, contains('flooding'));
    });
  });
}
