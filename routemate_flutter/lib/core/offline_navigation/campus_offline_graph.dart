import 'routing_graph.dart';

class CampusOfflineGraphBuilder {
  static RoutingGraph buildDefaultGraph() {
    final graph = RoutingGraph();

    // 1. Add Verified Campus Nodes & Safe Points
    const mainGate = GraphNode(
      id: 'node_main_gate',
      name: 'Campus Main Gate (Checkpost)',
      latitude: 9.5747,
      longitude: 77.6815,
      isSafePoint: true,
      safePointType: 'Security Guard Post & SOS Beacon',
    );

    const adminBlock = GraphNode(
      id: 'node_admin_block',
      name: 'Administrative Complex',
      latitude: 9.5755,
      longitude: 77.6820,
      isSafePoint: true,
      safePointType: '24/7 Guarded Reception',
    );

    const libraryQuad = GraphNode(
      id: 'node_library_quad',
      name: 'Central Library Quad (Well-Lit)',
      latitude: 9.5762,
      longitude: 77.6825,
      isSafePoint: false,
    );

    const healthCenter = GraphNode(
      id: 'node_health_center',
      name: '24/7 Campus Medical Clinic',
      latitude: 9.5750,
      longitude: 77.6835,
      isSafePoint: true,
      safePointType: '24/7 First Aid & Ambulance Dispatch',
    );

    const policeBooth = GraphNode(
      id: 'node_police_booth',
      name: 'East Campus Police Outpost',
      latitude: 9.5768,
      longitude: 77.6838,
      isSafePoint: true,
      safePointType: 'Police Outpost & Verified Safe Haven',
    );

    const northHostels = GraphNode(
      id: 'node_north_hostels',
      name: 'North Residence Halls',
      latitude: 9.5780,
      longitude: 77.6830,
      isSafePoint: true,
      safePointType: 'Warden Security Desk',
    );

    // Hazard Nodes
    const darkAlleyway = GraphNode(
      id: 'node_dark_alley',
      name: 'Dark Footpath (Behind Stadium)',
      latitude: 9.5765,
      longitude: 77.6810,
      isSafePoint: false,
    );

    const constructionZone = GraphNode(
      id: 'node_construction_zone',
      name: 'West Drainage Construction Lane',
      latitude: 9.5758,
      longitude: 77.6805,
      isSafePoint: false,
    );

    graph.addNode(mainGate);
    graph.addNode(adminBlock);
    graph.addNode(libraryQuad);
    graph.addNode(healthCenter);
    graph.addNode(policeBooth);
    graph.addNode(northHostels);
    graph.addNode(darkAlleyway);
    graph.addNode(constructionZone);

    // 2. Add Edges with Safety Metadata

    // Primary Safe Lit Avenue: Main Gate <-> Admin Block
    graph.addEdge(GraphEdge(
      id: 'edge_gate_admin',
      fromNodeId: 'node_main_gate',
      toNodeId: 'node_admin_block',
      distanceMeters: 110,
      lightingScore: 1.0,
      isAccessible: true,
      dataConfidence: 1.0,
    ));

    // Lit Quad Walkway: Admin Block <-> Library Quad
    graph.addEdge(GraphEdge(
      id: 'edge_admin_library',
      fromNodeId: 'node_admin_block',
      toNodeId: 'node_library_quad',
      distanceMeters: 105,
      lightingScore: 0.95,
      isAccessible: true,
      dataConfidence: 1.0,
    ));

    // North Campus Avenue: Library Quad <-> North Hostels
    graph.addEdge(GraphEdge(
      id: 'edge_library_hostels',
      fromNodeId: 'node_library_quad',
      toNodeId: 'node_north_hostels',
      distanceMeters: 210,
      lightingScore: 0.9,
      isAccessible: true,
      dataConfidence: 0.95,
    ));

    // Safe Shelter Corridor 1: Admin Block <-> Health Center
    graph.addEdge(GraphEdge(
      id: 'edge_admin_clinic',
      fromNodeId: 'node_admin_block',
      toNodeId: 'node_health_center',
      distanceMeters: 175,
      lightingScore: 0.85,
      isAccessible: true,
      dataConfidence: 0.95,
    ));

    // Safe Shelter Corridor 2: Health Center <-> Police Booth
    graph.addEdge(GraphEdge(
      id: 'edge_clinic_police',
      fromNodeId: 'node_health_center',
      toNodeId: 'node_police_booth',
      distanceMeters: 200,
      lightingScore: 0.9,
      isAccessible: true,
      dataConfidence: 1.0,
    ));

    // Safe Shelter Corridor 3: Police Booth <-> North Hostels
    graph.addEdge(GraphEdge(
      id: 'edge_police_hostels',
      fromNodeId: 'node_police_booth',
      toNodeId: 'node_north_hostels',
      distanceMeters: 160,
      lightingScore: 0.85,
      isAccessible: true,
      dataConfidence: 0.95,
    ));

    // HAZARDOUS EDGE 1: Unlit Shortcut with Low Data Confidence
    graph.addEdge(GraphEdge(
      id: 'edge_admin_dark_alley',
      fromNodeId: 'node_admin_block',
      toNodeId: 'node_dark_alley',
      distanceMeters: 140,
      hazardType: HazardType.unlitArea,
      lightingScore: 0.15,
      dataConfidence: 0.45, // Sparse telemetry triggers explicit warning
      isAccessible: true,
    ));

    graph.addEdge(GraphEdge(
      id: 'edge_dark_alley_hostels',
      fromNodeId: 'node_dark_alley',
      toNodeId: 'node_north_hostels',
      distanceMeters: 220,
      hazardType: HazardType.unlitArea,
      lightingScore: 0.2,
      dataConfidence: 0.5,
      isAccessible: true,
    ));

    // HAZARDOUS EDGE 2: Construction Zone
    graph.addEdge(GraphEdge(
      id: 'edge_gate_construction',
      fromNodeId: 'node_main_gate',
      toNodeId: 'node_construction_zone',
      distanceMeters: 160,
      hazardType: HazardType.isolatedConstruction,
      lightingScore: 0.3,
      isAccessible: false,
      dataConfidence: 0.8,
    ));

    return graph;
  }
}
