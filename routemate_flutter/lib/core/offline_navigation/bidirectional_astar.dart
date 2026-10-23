import 'dart:math' as math;
import 'routing_graph.dart';
import 'safety_evaluator.dart';

class RouteResult {
  final List<GraphNode> path;
  final double totalDistanceMeters;
  final double safetyScore; // 0.0 to 1.0 (1.0 = safe, well-lit, fully verified)
  final int nightScore; // 0 to 100 Night Activity Score
  final int cctvCount; // Total surveillance cameras along route
  final int openPlacesCount; // Total 24/7 open establishments
  final double maxDarkGapMeters; // Longest continuous dark/isolated stretch in meters
  final double mainRoadPercentage; // Percentage of route on well-lit main boulevards
  final int estimatedMinutes; // Estimated travel duration
  final String routeType; // 'safest' (recommended) or 'fastest'
  final List<String> uncertaintyWarnings;
  final List<String> avoidedHazards;
  final bool isDynamicReroute;
  final String status; // 'optimal_safe', 'fastest', 'fallback', 'no_path_found'

  const RouteResult({
    required this.path,
    required this.totalDistanceMeters,
    required this.safetyScore,
    this.nightScore = 50,
    this.cctvCount = 0,
    this.openPlacesCount = 0,
    this.maxDarkGapMeters = 0.0,
    this.mainRoadPercentage = 100.0,
    this.estimatedMinutes = 5,
    this.routeType = 'safest',
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
    String transitMode = 'walking',
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

    return _buildRouteResult(
      fullPath: fullPath,
      avoidedHazards: avoidedHazards,
      uncertaintyWarnings: uncertaintyWarnings.toList(),
      isDynamicReroute: isDynamicReroute,
      status: 'optimal_safe',
      routeType: 'safest',
      transitMode: transitMode,
    );
  }

  /// Calculates the fastest route based purely on physical distance / shortest path,
  /// ignoring safety penalties to let the user compare time vs. security trade-offs.
  RouteResult findFastestRoute({
    required String sourceNodeId,
    required String targetNodeId,
    String transitMode = 'walking',
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
        nightScore: 99,
        routeType: 'fastest',
        status: 'fastest',
      );
    }

    final Map<String, double> gScore = {sourceNodeId: 0.0};
    final Map<String, double> fScore = {sourceNodeId: 0.0};
    final Map<String, String> parent = {};
    final Set<String> openSet = {sourceNodeId};
    final Set<String> closedSet = {};

    while (openSet.isNotEmpty) {
      final currentId = _getMinFNode(openSet, fScore);
      if (currentId == targetNodeId) break;

      openSet.remove(currentId);
      closedSet.add(currentId);

      final outgoing = graph.adjacencyList[currentId] ?? [];
      for (final edge in outgoing) {
        if (edge.isBlocked) continue; // Skip only physically blocked edges
        final neighborId = edge.toNodeId;
        if (closedSet.contains(neighborId)) continue;

        final tentativeG = (gScore[currentId] ?? double.infinity) + edge.distanceMeters;
        if (tentativeG < (gScore[neighborId] ?? double.infinity)) {
          parent[neighborId] = currentId;
          gScore[neighborId] = tentativeG;
          fScore[neighborId] = tentativeG;
          openSet.add(neighborId);
        }
      }
    }

    if (!parent.containsKey(targetNodeId) && sourceNodeId != targetNodeId) {
      return const RouteResult(
        path: [],
        totalDistanceMeters: 0,
        safetyScore: 0,
        status: 'no_path_found',
      );
    }

    // Reconstruct Fastest Path
    final List<GraphNode> path = [];
    String? curr = targetNodeId;
    while (curr != null) {
      path.add(graph.nodes[curr]!);
      curr = parent[curr];
    }
    final fullPath = path.reversed.toList();

    return _buildRouteResult(
      fullPath: fullPath,
      avoidedHazards: const [],
      uncertaintyWarnings: const [],
      isDynamicReroute: false,
      status: 'fastest',
      routeType: 'fastest',
      transitMode: transitMode,
    );
  }

  RouteResult _buildRouteResult({
    required List<GraphNode> fullPath,
    required List<String> avoidedHazards,
    required List<String> uncertaintyWarnings,
    required bool isDynamicReroute,
    required String status,
    required String routeType,
    String transitMode = 'walking',
  }) {
    double physicalDistance = 0.0;
    double safetySum = 0.0;
    double lightingSum = 0.0;
    int totalCctv = 0;
    int totalOpenPlaces = 0;
    double maxDarkGap = 0.0;
    double mainRoadMeters = 0.0;
    int edgeCount = 0;

    for (int i = 0; i < fullPath.length - 1; i++) {
      final u = fullPath[i];
      final v = fullPath[i + 1];

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

      final dist = matchingEdge.distanceMeters > 0 ? matchingEdge.distanceMeters : u.distanceTo(v);
      physicalDistance += dist;

      final eval = safetyEvaluator.evaluateEdge(matchingEdge);
      safetySum += eval.safetyScore;
      lightingSum += matchingEdge.lightingScore;
      totalCctv += matchingEdge.cctvCount;
      totalOpenPlaces += matchingEdge.open24x7PlacesCount;
      if (matchingEdge.maxDarkGapMeters > maxDarkGap) {
        maxDarkGap = matchingEdge.maxDarkGapMeters;
      }
      if (matchingEdge.roadCategory == 'main_boulevard') {
        mainRoadMeters += dist;
      }
      edgeCount++;
    }

    final double compositeSafetyScore = edgeCount > 0 ? (safetySum / edgeCount) : 1.0;
    final double avgLighting = edgeCount > 0 ? (lightingSum / edgeCount) : 1.0;
    final double mainRoadRatio = physicalDistance > 0 ? (mainRoadMeters / physicalDistance) : 1.0;

    final nightScore = safetyEvaluator.computeNightScore(
      lightingScore: avgLighting,
      openPlacesCount: totalOpenPlaces,
      cctvCount: totalCctv,
      distanceMeters: physicalDistance,
      maxDarkGapMeters: maxDarkGap,
      mainRoadRatio: mainRoadRatio,
      transitMode: transitMode,
    );

    // Speed: walking ~ 75 m/min (~4.5 km/h); two-wheeler ~ 350 m/min (~21 km/h)
    final metersPerMin = transitMode == 'two_wheeler' ? 350.0 : 75.0;
    final estimatedMinutes = math.max(1, (physicalDistance / metersPerMin).round());

    return RouteResult(
      path: fullPath,
      totalDistanceMeters: physicalDistance,
      safetyScore: compositeSafetyScore,
      nightScore: nightScore,
      cctvCount: totalCctv,
      openPlacesCount: totalOpenPlaces,
      maxDarkGapMeters: maxDarkGap,
      mainRoadPercentage: (mainRoadRatio * 100).roundToDouble(),
      estimatedMinutes: estimatedMinutes,
      routeType: routeType,
      uncertaintyWarnings: uncertaintyWarnings,
      avoidedHazards: avoidedHazards,
      isDynamicReroute: isDynamicReroute,
      status: status,
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
