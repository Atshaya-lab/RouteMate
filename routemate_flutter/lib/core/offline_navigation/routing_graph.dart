import 'dart:math' as math;

enum HazardType {
  none,
  unlitArea,
  isolatedConstruction,
  reportedIncident,
  restrictedZone,
  steepInaccessibleTerrain,
}

class GraphNode {
  final String id;
  final String name;
  final double latitude;
  final double longitude;
  final bool isSafePoint; // e.g. Police Booth, 24/7 Clinic, Campus Sentinel Post
  final String? safePointType;

  const GraphNode({
    required this.id,
    required this.name,
    required this.latitude,
    required this.longitude,
    this.isSafePoint = false,
    this.safePointType,
  });

  // Haversine distance in meters to another node
  double distanceTo(GraphNode other) {
    const double earthRadius = 6371000; // meters
    final dLat = _toRadians(other.latitude - latitude);
    final dLon = _toRadians(other.longitude - longitude);

    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(_toRadians(latitude)) *
            math.cos(_toRadians(other.latitude)) *
            math.sin(dLon / 2) *
            math.sin(dLon / 2);

    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadius * c;
  }

  static double _toRadians(double degree) => degree * math.pi / 180;
}

class GraphEdge {
  final String id;
  final String fromNodeId;
  final String toNodeId;
  final double distanceMeters;
  final HazardType hazardType;
  final double lightingScore; // 0.0 (pitch dark) to 1.0 (illuminated floodlit)
  final bool isAccessible; // Accessible for walkers / mobility aids
  final bool isRestricted; // Curfew or private access
  final double dataConfidence; // 0.0 (uncertain/unverified) to 1.0 (verified)
  bool isBlocked; // Dynamic status: reported blocked on-the-fly
  final int cctvCount; // Public surveillance cameras on this stretch
  final int open24x7PlacesCount; // Verified 24/7 pharmacies, clinics, stores open late
  final double maxDarkGapMeters; // Longest continuous unlit / empty stretch on this edge
  final String roadCategory; // 'main_boulevard', 'lit_walkway', 'secluded_alley'

  GraphEdge({
    required this.id,
    required this.fromNodeId,
    required this.toNodeId,
    required this.distanceMeters,
    this.hazardType = HazardType.none,
    this.lightingScore = 1.0,
    this.isAccessible = true,
    this.isRestricted = false,
    this.dataConfidence = 1.0,
    this.isBlocked = false,
    this.cctvCount = 0,
    this.open24x7PlacesCount = 0,
    this.maxDarkGapMeters = 0.0,
    this.roadCategory = 'main_boulevard',
  });
}

/// Represents a physical Point of Interest (POI) or surveillance asset along routes.
class SafetyPoi {
  final String id;
  final String name;
  final String category; // 'open_24x7', 'cctv', 'police', 'clinic', 'isolated_alert'
  final double latitude;
  final double longitude;
  final String subtitle;

  const SafetyPoi({
    required this.id,
    required this.name,
    required this.category,
    required this.latitude,
    required this.longitude,
    required this.subtitle,
  });
}

class RoutingGraph {
  final Map<String, GraphNode> nodes = {};
  final Map<String, List<GraphEdge>> adjacencyList = {}; // Node ID -> Outgoing edges
  final Map<String, List<GraphEdge>> reverseAdjacencyList = {}; // Node ID -> Incoming edges

  void addNode(GraphNode node) {
    nodes[node.id] = node;
    adjacencyList.putIfAbsent(node.id, () => []);
    reverseAdjacencyList.putIfAbsent(node.id, () => []);
  }

  void addEdge(GraphEdge edge, {bool bidirectional = true}) {
    adjacencyList.putIfAbsent(edge.fromNodeId, () => []).add(edge);
    reverseAdjacencyList.putIfAbsent(edge.toNodeId, () => []).add(edge);

    if (bidirectional) {
      final reverseEdge = GraphEdge(
        id: '${edge.id}_rev',
        fromNodeId: edge.toNodeId,
        toNodeId: edge.fromNodeId,
        distanceMeters: edge.distanceMeters,
        hazardType: edge.hazardType,
        lightingScore: edge.lightingScore,
        isAccessible: edge.isAccessible,
        isRestricted: edge.isRestricted,
        dataConfidence: edge.dataConfidence,
        isBlocked: edge.isBlocked,
        cctvCount: edge.cctvCount,
        open24x7PlacesCount: edge.open24x7PlacesCount,
        maxDarkGapMeters: edge.maxDarkGapMeters,
        roadCategory: edge.roadCategory,
      );
      adjacencyList.putIfAbsent(reverseEdge.fromNodeId, () => []).add(reverseEdge);
      reverseAdjacencyList.putIfAbsent(reverseEdge.toNodeId, () => []).add(reverseEdge);
    }
  }

  void setEdgeBlocked(String edgeId, bool blocked) {
    for (final edges in adjacencyList.values) {
      for (final edge in edges) {
        if (edge.id == edgeId || edge.id == '${edgeId}_rev') {
          edge.isBlocked = blocked;
        }
      }
    }
  }

  void clearAllBlocks() {
    for (final edges in adjacencyList.values) {
      for (final edge in edges) {
        edge.isBlocked = false;
      }
    }
  }
}
