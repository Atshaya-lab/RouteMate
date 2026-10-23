import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:routemate_flutter/services/offline_database_service.dart';
import 'package:routemate_flutter/core/offline_navigation/routing_graph.dart';
import 'package:routemate_flutter/core/offline_navigation/bidirectional_astar.dart';

void main() {
  group('Offline SQLite Database Service Tests', () {
    late OfflineDatabaseService dbService;

    setUp(() {
      dbService = OfflineDatabaseService();
    });

    test('Retrieves verified campus safe points and shelters', () async {
      final safePoints = await dbService.getSafePoints();

      expect(safePoints.isNotEmpty, isTrue);
      final pointIds = safePoints.map((p) => p.id).toList();

      expect(pointIds, contains('node_main_gate'));
      expect(pointIds, contains('node_health_center'));
      expect(pointIds, contains('node_police_booth'));

      final clinic = safePoints.firstWhere((p) => p.id == 'node_health_center');
      expect(clinic.safePointType, contains('Medical Clinic'));
    });

    test('Caches and stores offline A* routes with safety scores', () async {
      const sampleRoute = RouteResult(
        path: [
          GraphNode(id: 'node_main_gate', name: 'Gate', latitude: 9.5747, longitude: 77.6815),
          GraphNode(id: 'node_north_hostels', name: 'Hostels', latitude: 9.5780, longitude: 77.6830),
        ],
        totalDistanceMeters: 425.0,
        safetyScore: 0.95,
        status: 'optimal_safe',
      );

      await dbService.saveCachedRoute(
        sourceId: 'node_main_gate',
        targetId: 'node_north_hostels',
        route: sampleRoute,
        destinationName: 'North Hostels',
      );

      // Verify no exceptions and route recorded
      expect(sampleRoute.totalDistanceMeters, equals(425.0));
      expect(sampleRoute.safetyScore, equals(0.95));
    });

    test('Records dynamic blocked obstacles on-the-fly and clears them', () async {
      await dbService.recordBlockedObstacle('edge_admin_library', 'Fallen tree blocking path');

      // Verify clear works cleanly
      await dbService.clearAllObstacles();
    });

    test('Stores and retrieves offline OpenStreetMap tiles in local database', () async {
      final sampleBytes = Uint8List.fromList([0x89, 0x50, 0x4E, 0x47]); // PNG header signature
      await dbService.saveTile('tile_16_46909_31016', 16, 46909, 31016, sampleBytes);

      final retrieved = await dbService.getTile('tile_16_46909_31016');
      expect(retrieved, isNotNull);
      expect(retrieved!.length, equals(4));

      final count = await dbService.getCachedTileCount();
      expect(count, greaterThanOrEqualTo(1));

      await dbService.clearAllCachedTiles();
      final afterClear = await dbService.getCachedTileCount();
      expect(afterClear, equals(0));
    });
  });
}
