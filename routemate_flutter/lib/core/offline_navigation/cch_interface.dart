import 'routing_graph.dart';

/// Contract for future upgrade to Customizable Contraction Hierarchies (CCH).
///
/// While Bidirectional A* powers the initial prototype for campus and neighborhood
/// scales, CCH is the planned architecture for scaling to massive multi-county
/// regional road networks with dynamic real-time traffic and hazard weight changes.
///
/// CCH operates in 3 distinct phases:
/// 1. Preprocessing (Metric-independent contraction ordering using nested dissection).
/// 2. Customization (Rapid edge weight assignment without altering node hierarchy).
/// 3. Query (Bidirectional Dijkstra on upward graphs with microsecond response).
abstract class CustomizableContractionHierarchies {
  /// Phase 1: Preprocesses the topological graph and computes a contraction hierarchy
  /// independent of dynamic weights (e.g. weather, safety penalties, night illumination).
  Future<void> precomputeContractionOrder(RoutingGraph baseGraph);

  /// Phase 2: Customizes edge weights on the fly (e.g. applying safety hazard penalties,
  /// night walking constraints, or blocked road reports) in milliseconds.
  void customizeMetricWeights(Map<String, double> dynamicWeights);

  /// Phase 3: Executes bidirectional query on the contracted graph in sub-millisecond time.
  List<GraphNode> queryShortestPath(String sourceNodeId, String targetNodeId);

  /// Returns whether CCH index is precomputed and ready for evaluation.
  bool get isCustomized;
}
