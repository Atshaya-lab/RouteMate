import 'routing_graph.dart';
import 'safety_evaluator.dart';
import 'bidirectional_astar.dart';

class BlockedPathReport {
  final String edgeId;
  final String reason;
  final int timestamp;

  const BlockedPathReport({
    required this.edgeId,
    required this.reason,
    required this.timestamp,
  });
}

class DynamicRerouter {
  final RoutingGraph graph;
  final SafetyEvaluator safetyEvaluator;
  final List<BlockedPathReport> _blockedReports = [];

  DynamicRerouter({
    required this.graph,
    this.safetyEvaluator = const SafetyEvaluator(),
  });

  List<BlockedPathReport> get blockedReports => List.unmodifiable(_blockedReports);

  /// Reports a specific path/segment as blocked or impassable on-the-fly without internet,
  /// marks the graph edge blocked, and recalculates an alternate safe route using Bidirectional A*.
  RouteResult reportPathBlockedAndReroute({
    required String edgeId,
    required String reason,
    required String currentSourceNodeId,
    required String targetNodeId,
  }) {
    // 1. Locally block the edge in the graph
    graph.setEdgeBlocked(edgeId, true);
    _blockedReports.add(
      BlockedPathReport(
        edgeId: edgeId,
        reason: reason,
        timestamp: DateTime.now().millisecondsSinceEpoch,
      ),
    );

    // 2. Immediately execute local Bidirectional A* recalculation
    final algorithm = BidirectionalAStar(
      graph: graph,
      safetyEvaluator: safetyEvaluator,
    );

    return algorithm.findSafeRoute(
      sourceNodeId: currentSourceNodeId,
      targetNodeId: targetNodeId,
      isDynamicReroute: true,
    );
  }

  /// Clears all local obstacle reports and restores base graph traversability.
  void clearAllObstacles() {
    graph.clearAllBlocks();
    _blockedReports.clear();
  }
}
