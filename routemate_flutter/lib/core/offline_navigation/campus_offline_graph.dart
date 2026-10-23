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
      cctvCount: 3,
      open24x7PlacesCount: 2,
      maxDarkGapMeters: 0,
      roadCategory: 'main_boulevard',
    ));

    // Lit Quad Walkway: Admin Block <-> Library Quad
    graph.addEdge(GraphEdge(
      id: 'edge_admin_library',
      fromNodeId: 'node_admin_block',
      toNodeId: 'node_library_quad',
      distanceMeters: 130,
      lightingScore: 0.95,
      isAccessible: true,
      dataConfidence: 1.0,
      cctvCount: 2,
      open24x7PlacesCount: 2,
      maxDarkGapMeters: 10,
      roadCategory: 'main_boulevard',
    ));

    // North Campus Avenue: Library Quad <-> North Hostels
    graph.addEdge(GraphEdge(
      id: 'edge_library_hostels',
      fromNodeId: 'node_library_quad',
      toNodeId: 'node_north_hostels',
      distanceMeters: 240,
      lightingScore: 0.9,
      isAccessible: true,
      dataConfidence: 0.95,
      cctvCount: 4,
      open24x7PlacesCount: 3,
      maxDarkGapMeters: 15,
      roadCategory: 'main_boulevard',
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
      cctvCount: 2,
      open24x7PlacesCount: 3,
      maxDarkGapMeters: 15,
      roadCategory: 'lit_walkway',
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
      cctvCount: 3,
      open24x7PlacesCount: 2,
      maxDarkGapMeters: 10,
      roadCategory: 'lit_walkway',
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
      cctvCount: 2,
      open24x7PlacesCount: 1,
      maxDarkGapMeters: 15,
      roadCategory: 'lit_walkway',
    ));

    // FAST BUT UNLIT SHORTCUT (Hazardous Stretch with Zero Shops/CCTV):
    // Admin Block -> Dark Alley (110m) -> North Hostels (150m) = 260m vs 370m via Lit Boulevard
    graph.addEdge(GraphEdge(
      id: 'edge_admin_dark_alley',
      fromNodeId: 'node_admin_block',
      toNodeId: 'node_dark_alley',
      distanceMeters: 110,
      hazardType: HazardType.unlitArea,
      lightingScore: 0.1,
      dataConfidence: 0.4,
      isAccessible: true,
      cctvCount: 0,
      open24x7PlacesCount: 0,
      maxDarkGapMeters: 110,
      roadCategory: 'secluded_alley',
    ));

    graph.addEdge(GraphEdge(
      id: 'edge_dark_alley_hostels',
      fromNodeId: 'node_dark_alley',
      toNodeId: 'node_north_hostels',
      distanceMeters: 150,
      hazardType: HazardType.unlitArea,
      lightingScore: 0.15,
      dataConfidence: 0.45,
      isAccessible: true,
      cctvCount: 0,
      open24x7PlacesCount: 0,
      maxDarkGapMeters: 150,
      roadCategory: 'secluded_alley',
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
      cctvCount: 0,
      open24x7PlacesCount: 0,
      maxDarkGapMeters: 160,
      roadCategory: 'secluded_alley',
    ));

    return graph;
  }

  /// Returns static POIs for 24/7 open stores, surveillance cameras, police, and warning beacons
  static List<SafetyPoi> getCampusSafetyPois() {
    return const [
      SafetyPoi(
        id: 'poi_clinic_247',
        name: 'Campus Medical Clinic',
        category: 'open_24x7',
        latitude: 9.5750,
        longitude: 77.6835,
        subtitle: '24/7 First Aid & Emergency Doctor',
      ),
      SafetyPoi(
        id: 'poi_pharmacy_247',
        name: 'Apollo 24/7 Pharmacy',
        category: 'open_24x7',
        latitude: 9.5756,
        longitude: 77.6823,
        subtitle: 'Open All Night • Medicine & Shelter',
      ),
      SafetyPoi(
        id: 'poi_police_outpost',
        name: 'East Police Outpost',
        category: 'police',
        latitude: 9.5768,
        longitude: 77.6838,
        subtitle: 'Active 24/7 Patrol & SOS Station',
      ),
      SafetyPoi(
        id: 'poi_gate_security',
        name: 'Main Gate Checkpost',
        category: 'police',
        latitude: 9.5747,
        longitude: 77.6815,
        subtitle: 'Campus Security & Barrier Desk',
      ),
      SafetyPoi(
        id: 'poi_cctv_quad',
        name: 'CCTV #104 Quad PTZ',
        category: 'cctv',
        latitude: 9.5758,
        longitude: 77.6822,
        subtitle: 'Live Public Surveillance Node',
      ),
      SafetyPoi(
        id: 'poi_cctv_north',
        name: 'CCTV #108 North Avenue',
        category: 'cctv',
        latitude: 9.5772,
        longitude: 77.6828,
        subtitle: 'High-Res Street Surveillance',
      ),
      SafetyPoi(
        id: 'poi_cctv_library',
        name: 'CCTV #112 Library Hub',
        category: 'cctv',
        latitude: 9.5763,
        longitude: 77.6826,
        subtitle: 'Safe Passage Monitored Area',
      ),
      SafetyPoi(
        id: 'poi_alert_dark_alley',
        name: 'Dark Gap Warning',
        category: 'isolated_alert',
        latitude: 9.5765,
        longitude: 77.6810,
        subtitle: '260m Unlit Stretch • No Open Shops',
      ),
    ];
  }
}
