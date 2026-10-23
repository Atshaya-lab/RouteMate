import 'dart:math' as math;
import 'routing_graph.dart';
import 'safety_evaluator.dart';

class RouteResult {
  final List<GraphNode> path;
  final double totalDistanceMeters;
  final double safetyScore; // 0.0 to 1.0 (1.0 = safe, well-lit, fully verified)
  final List<String> uncertaintyWarnings;
  final List<String> avoidedHazards;
  final bool isDynamicReroute;
  final String status; // 'optimal_safe', 'fallback', 'no_path_found'

  const RouteResult({
    required this.path,
    required this.totalDistanceMeters,
    required this.safetyScore,
    this.uncertaintyWarnings = const [],
    this.avoidedHazards = const [],
    this.isDynamicReroute = false,
    this.status = 'optimal_safe',
  });
}

class BidirectionalAStar {
  final RoutingGraph graph;
  final SafetyEvaluator safetyEvaluator;

  BidirectionalAStar({
    required this.graph,
    this.safetyEvaluator = const SafetyEvaluator(),
  });

  RouteResult findSafeRoute({
    required String sourceNodeId,
    required String targetNodeId,
    bool isDynamicReroute = false,
  }) {
    final startNode = graph.nodes[sourceNodeId];
    final targetNode = graph.nodes[targetNodeId];

    if (startNode == null || targetNode == null) {
      return const RouteResult(
        path: [],
        totalDistanceMeters: 0,
        safetyScore: 0,
        status: 'no_path_found',
      );
    }

    if (sourceNodeId == targetNodeId) {
      return RouteResult(
        path: [startNode],
        totalDistanceMeters: 0,
        safetyScore: 1.0,
        status: 'optimal_safe',
      );
    }

    // Forward Search State
    final Map<String, double> gForward = {sourceNodeId: 0.0};
    final Map<String, double> fForward = {
      sourceNodeId: startNode.distanceTo(targetNode),
    };
    final Map<String, String> parentForward = {};
    final Map<String, GraphEdge> forwardEdges = {};
    final Set<String> openSetForward = {sourceNodeId};
    final Set<String> closedSetForward = {};

    // Backward Search State
    final Map<String, double> gBackward = {targetNodeId: 0.0};
    final Map<String, double> fBackward = {
      targetNodeId: targetNode.distanceTo(startNode),
    };
    final Map<String, String> parentBackward = {};
    final Map<String, GraphEdge> backwardEdges = {};
    final Set<String> openSetBackward = {targetNodeId};
    final Set<String> closedSetBackward = {};

    String? bestMeetingNode;
    double bestTotalCost = double.infinity;

    final List<String> avoidedHazards = [];
    final Set<String> uncertaintyWarnings = {};

    while (openSetForward.isNotEmpty && openSetBackward.isNotEmpty) {
      // 1. Expand Forward Frontier
      final currentForwardId = _getMinFNode(openSetForward, fForward);
      openSetForward.remove(currentForwardId);
      closedSetForward.add(currentForwardId);

      // Check if backward search has already explored this node
      if (closedSetBackward.contains(currentForwardId)) {
        final totalG = (gForward[currentForwardId] ?? double.infinity) +
            (gBackward[currentForwardId] ?? double.infinity);
        if (totalG < bestTotalCost) {
          bestTotalCost = totalG;
          bestMeetingNode = currentForwardId;
          break; // Consistent meeting point found
        }
      }

      final forwardOutgoing = graph.adjacencyList[currentForwardId] ?? [];
      for (final edge in forwardOutgoing) {
        final eval = safetyEvaluator.evaluateEdge(edge);
        if (!eval.isPass) {
          if (eval.rejectionReason != null &&
              !avoidedHazards.contains(eval.rejectionReason)) {
            avoidedHazards.add('${edge.id}: ${eval.rejectionReason}');
          }
          continue; // Constrained: Skip unsafe or blocked edge
        }

        if (eval.uncertaintyWarning != null) {
          uncertaintyWarnings.add(eval.uncertaintyWarning!);
        }

        final neighborId = edge.toNodeId;
        if (closedSetForward.contains(neighborId)) continue;

        final tentativeG = (gForward[currentForwardId] ?? double.infinity) +
            eval.effectiveCost;

        if (tentativeG < (gForward[neighborId] ?? double.infinity)) {
          parentForward[neighborId] = currentForwardId;
          forwardEdges[neighborId] = edge;
          gForward[neighborId] = tentativeG;

          final neighborNode = graph.nodes[neighborId]!;
          fForward[neighborId] = tentativeG + neighborNode.distanceTo(targetNode);
          openSetForward.add(neighborId);

          if (closedSetBackward.contains(neighborId)) {
            final potentialTotal =
                tentativeG + (gBackward[neighborId] ?? double.infinity);
            if (potentialTotal < bestTotalCost) {
              bestTotalCost = potentialTotal;
              bestMeetingNode = neighborId;
            }
          }
        }
      }

      // 2. Expand Backward Frontier
      final currentBackwardId = _getMinFNode(openSetBackward, fBackward);
      openSetBackward.remove(currentBackwardId);
      closedSetBackward.add(currentBackwardId);

      if (closedSetForward.contains(currentBackwardId)) {
        final totalG = (gForward[currentBackwardId] ?? double.infinity) +
            (gBackward[currentBackwardId] ?? double.infinity);
        if (totalG < bestTotalCost) {
          bestTotalCost = totalG;
          bestMeetingNode = currentBackwardId;
          break; // Meeting point found
        }
      }

      // In backward direction, traverse reverse incoming edges
      final backwardIncoming =
          graph.reverseAdjacencyList[currentBackwardId] ?? [];
      for (final edge in backwardIncoming) {
        final eval = safetyEvaluator.evaluateEdge(edge);
        if (!eval.isPass) {
          if (eval.rejectionReason != null &&
              !avoidedHazards.contains(eval.rejectionReason)) {
            avoidedHazards.add('${edge.id}: ${eval.rejectionReason}');
          }
          continue; // Constrained: Skip unsafe or blocked edge
        }

        if (eval.uncertaintyWarning != null) {
          uncertaintyWarnings.add(eval.uncertaintyWarning!);
        }

        final neighborId = edge.fromNodeId;
        if (closedSetBackward.contains(neighborId)) continue;

        final tentativeG = (gBackward[currentBackwardId] ?? double.infinity) +
            eval.effectiveCost;

        if (tentativeG < (gBackward[neighborId] ?? double.infinity)) {
          parentBackward[neighborId] = currentBackwardId;
          backwardEdges[neighborId] = edge;
          gBackward[neighborId] = tentativeG;

          final neighborNode = graph.nodes[neighborId]!;
          fBackward[neighborId] = tentativeG + neighborNode.distanceTo(startNode);
          openSetBackward.add(neighborId);

          if (closedSetForward.contains(neighborId)) {
            final potentialTotal =
                (gForward[neighborId] ?? double.infinity) + tentativeG;
            if (potentialTotal < bestTotalCost) {
              bestTotalCost = potentialTotal;
              bestMeetingNode = neighborId;
            }
          }
        }
      }
    }

    if (bestMeetingNode == null) {
      return RouteResult(
        path: [],
        totalDistanceMeters: 0,
        safetyScore: 0,
        avoidedHazards: avoidedHazards,
        uncertaintyWarnings: uncertaintyWarnings.toList(),
        status: 'no_path_found',
      );
    }

    // Reconstruct Complete Path: start -> ... -> meetingNode -> ... -> target
    final List<GraphNode> fullPath = [];

    // Forward segment (from start to meeting node)
    String? curr = bestMeetingNode;
    final List<GraphNode> forwardSegment = [];
    while (curr != null) {
      forwardSegment.add(graph.nodes[curr]!);
      curr = parentForward[curr];
    }
    fullPath.addAll(forwardSegment.reversed);

    // Backward segment (from meeting node to target)
    curr = parentBackward[bestMeetingNode];
    while (curr != null) {
      fullPath.add(graph.nodes[curr]!);
      curr = parentBackward[curr];
    }

    // Calculate actual geographical physical distance and composite safety score
    double physicalDistance = 0.0;
    double safetySum = 0.0;
    int edgeCount = 0;

    for (int i = 0; i < fullPath.length - 1; i++) {
      final u = fullPath[i];
      final v = fullPath[i + 1];
      physicalDistance += u.distanceTo(v);

      // Find matching edge to assess safety score
      final edges = graph.adjacencyList[u.id] ?? [];
      final matchingEdge = edges.firstWhere(
        (e) => e.toNodeId == v.id,
        orElse: () => GraphEdge(
          id: 'temp',
          fromNodeId: u.id,
          toNodeId: v.id,
          distanceMeters: u.distanceTo(v),
        ),
      );
      final eval = safetyEvaluator.evaluateEdge(matchingEdge);
      safetySum += eval.safetyScore;
      edgeCount++;
    }

    final double compositeSafetyScore =
        edgeCount > 0 ? (safetySum / edgeCount) : 1.0;

    return RouteResult(
      path: fullPath,
      totalDistanceMeters: physicalDistance,
      safetyScore: compositeSafetyScore,
      uncertaintyWarnings: uncertaintyWarnings.toList(),
      avoidedHazards: avoidedHazards,
      isDynamicReroute: isDynamicReroute,
      status: 'optimal_safe',
    );
  }

  String _getMinFNode(Set<String> openSet, Map<String, double> fScores) {
    String minNode = openSet.first;
    double minF = fScores[minNode] ?? double.infinity;

    for (final node in openSet) {
      final f = fScores[node] ?? double.infinity;
      if (f < minF) {
        minF = f;
        minNode = node;
      }
    }
    return minNode;
  }
}
