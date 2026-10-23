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

    test('Night Activity Score incorporates lighting, open stores, CCTVs and dark gap penalties', () {
      // Safe, well-lit street with open stores and CCTVs
      final safeScore = evaluator.computeNightScore(
        lightingScore: 0.95,
        openPlacesCount: 4,
        cctvCount: 5,
        distanceMeters: 400,
        maxDarkGapMeters: 10,
        mainRoadRatio: 1.0,
        transitMode: 'walking',
      );

      // Unlit alley with zero stores, zero CCTVs, and 200m dark gap
      final dangerousScore = evaluator.computeNightScore(
        lightingScore: 0.15,
        openPlacesCount: 0,
        cctvCount: 0,
        distanceMeters: 250,
        maxDarkGapMeters: 200,
        mainRoadRatio: 0.0,
        transitMode: 'walking',
      );

      expect(safeScore, greaterThan(80));
      expect(dangerousScore, lessThan(35));
      expect(safeScore, greaterThan(dangerousScore));
    });

    test('Dual Route Comparison: Computes Safest vs Fastest route with trade-offs', () {
      final safest = astar.findSafeRoute(
        sourceNodeId: 'node_main_gate',
        targetNodeId: 'node_north_hostels',
        transitMode: 'walking',
      );

      final fastest = astar.findFastestRoute(
        sourceNodeId: 'node_main_gate',
        targetNodeId: 'node_north_hostels',
        transitMode: 'walking',
      );

      // Safest route follows well-lit avenues with high night activity score
      expect(safest.routeType, equals('safest'));
      expect(safest.nightScore, greaterThan(75));
      expect(safest.openPlacesCount, greaterThanOrEqualTo(3));
      expect(safest.cctvCount, greaterThanOrEqualTo(3));
      expect(safest.maxDarkGapMeters, lessThanOrEqualTo(25));

      // Fastest route chooses the direct shortcut through the dark alley
      expect(fastest.routeType, equals('fastest'));
      expect(fastest.totalDistanceMeters, lessThan(safest.totalDistanceMeters));
      expect(fastest.nightScore, lessThan(safest.nightScore));
      expect(fastest.maxDarkGapMeters, greaterThanOrEqualTo(100)); // Has high dark stretch
    });

    test('Walking mode applies higher dark-gap sensitivity than two-wheeler mode', () {
      final walkingScore = evaluator.computeNightScore(
        lightingScore: 0.4,
        openPlacesCount: 1,
        cctvCount: 1,
        distanceMeters: 300,
        maxDarkGapMeters: 150,
        mainRoadRatio: 0.5,
        transitMode: 'walking',
      );

      final twoWheelerScore = evaluator.computeNightScore(
        lightingScore: 0.4,
        openPlacesCount: 1,
        cctvCount: 1,
        distanceMeters: 300,
        maxDarkGapMeters: 150,
        mainRoadRatio: 0.5,
        transitMode: 'two_wheeler',
      );

      // On a motorized two-wheeler, a rider crosses the 150m dark stretch in seconds,
      // so the dark-gap vulnerability penalty is lower than for a lone pedestrian
      expect(twoWheelerScore, greaterThan(walkingScore));
    });

    test('Campus safety POIs contains verified 24/7 stores, surveillance, and alert beacons', () {
      final pois = CampusOfflineGraphBuilder.getCampusSafetyPois();
      expect(pois.isNotEmpty, isTrue);

      final categories = pois.map((p) => p.category).toSet();
      expect(categories, contains('open_24x7'));
      expect(categories, contains('cctv'));
      expect(categories, contains('police'));
      expect(categories, contains('isolated_alert'));
    });
  });
}
