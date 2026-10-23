import 'dart:convert';
import 'dart:math' as math;
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';
import '../core/offline_navigation/routing_graph.dart';
import '../core/offline_navigation/bidirectional_astar.dart';
import '../core/offline_navigation/dynamic_rerouter.dart';

class OfflineDatabaseService {
  static final OfflineDatabaseService _instance = OfflineDatabaseService._internal();
  factory OfflineDatabaseService() => _instance;
  OfflineDatabaseService._internal();

  Database? _db;
  // Fallback in-memory store for web preview & headless test environments
  final Map<String, Map<String, dynamic>> _inMemorySafePoints = {};
  final Map<String, Map<String, dynamic>> _inMemoryCachedRoutes = {};
  final Map<String, BlockedPathReport> _inMemoryBlockedObstacles = {};
  final Map<String, Uint8List> _inMemoryMapTiles = {};

  Future<Database?> get database async {
    if (kIsWeb) return null;
    if (_db != null) return _db;

    try {
      _db = await _initDatabase();
      return _db;
    } catch (_) {
      // In unit test or web environments where native sqflite plugin channel
      // is unavailable, fallback to memory-backed adapter
      return null;
    }
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, 'routemate_offline.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: (db, version) async {
        // 1. Offline Safe Points Table (Shelters, Clinics, Police)
        await db.execute('''
          CREATE TABLE safe_points (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            type TEXT,
            phone TEXT,
            verified INTEGER DEFAULT 1
          )
        ''');

        // 2. Cached A* Pedestrian Routes Table
        await db.execute('''
          CREATE TABLE cached_routes (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            target_id TEXT NOT NULL,
            destination_name TEXT,
            distance_meters REAL,
            safety_score REAL,
            nodes_json TEXT,
            cached_at INTEGER
          )
        ''');

        // 3. Local Dynamic Blocked Path Reports Table
        await db.execute('''
          CREATE TABLE blocked_obstacles (
            edge_id TEXT PRIMARY KEY,
            reason TEXT,
            reported_at INTEGER
          )
        ''');

        // 4. Regional Offline Map Tiles Cache Table (Antigravity Offline Storage)
        await db.execute('''
          CREATE TABLE IF NOT EXISTS map_tiles (
            tile_key TEXT PRIMARY KEY,
            z INTEGER NOT NULL,
            x INTEGER NOT NULL,
            y INTEGER NOT NULL,
            tile_bytes BLOB NOT NULL,
            cached_at INTEGER
          )
        ''');

        // Pre-seed default campus safe havens into SQLite
        await _seedDefaultSafePoints(db);
      },
    );
  }

  Future<void> _seedDefaultSafePoints(Database db) async {
    final defaultSafePoints = [
      {
        'id': 'node_main_gate',
        'name': 'Campus Main Gate (Checkpost)',
        'latitude': 9.5747,
        'longitude': 77.6815,
        'type': 'Security Guard Post & SOS Beacon',
        'phone': '+91 94444 00001',
        'verified': 1,
      },
      {
        'id': 'node_health_center',
        'name': '24/7 Campus Medical Clinic',
        'latitude': 9.5750,
        'longitude': 77.6835,
        'type': '24/7 First Aid & Medical Clinic',
        'phone': '+91 94444 00002',
        'verified': 1,
      },
      {
        'id': 'node_police_booth',
        'name': 'East Campus Police Outpost',
        'latitude': 9.5768,
        'longitude': 77.6838,
        'type': 'Police Outpost & Verified Safe Haven',
        'phone': '112',
        'verified': 1,
      },
    ];

    for (final sp in defaultSafePoints) {
      await db.insert('safe_points', sp, conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }

  /// Retrieves verified safe points from local SQLite (or fallback memory)
  Future<List<GraphNode>> getSafePoints() async {
    final db = await database;
    if (db == null) {
      if (_inMemorySafePoints.isEmpty) _seedMemorySafePoints();
      return _inMemorySafePoints.values.map((map) {
        return GraphNode(
          id: map['id'] as String,
          name: map['name'] as String,
          latitude: map['latitude'] as double,
          longitude: map['longitude'] as double,
          isSafePoint: true,
          safePointType: map['type'] as String?,
        );
      }).toList();
    }

    final list = await db.query('safe_points');
    return list.map((map) {
      return GraphNode(
        id: map['id'] as String,
        name: map['name'] as String,
        latitude: map['latitude'] as double,
        longitude: map['longitude'] as double,
        isSafePoint: true,
        safePointType: map['type'] as String?,
      );
    }).toList();
  }

  /// Caches a calculated A* route locally in SQLite
  Future<void> saveCachedRoute({
    required String sourceId,
    required String targetId,
    required RouteResult route,
    String? destinationName,
  }) async {
    final nodesJson = jsonEncode(
      route.path.map((n) => {'id': n.id, 'name': n.name, 'lat': n.latitude, 'lon': n.longitude}).toList(),
    );

    final row = {
      'id': '${sourceId}_$targetId',
      'source_id': sourceId,
      'target_id': targetId,
      'destination_name': destinationName ?? 'Destination',
      'distance_meters': route.totalDistanceMeters,
      'safety_score': route.safetyScore,
      'nodes_json': nodesJson,
      'cached_at': DateTime.now().millisecondsSinceEpoch,
    };

    final db = await database;
    if (db == null) {
      _inMemoryCachedRoutes[row['id'] as String] = row;
      return;
    }

    await db.insert('cached_routes', row, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  /// Retrieves a previously cached offline route from SQLite
  Future<Map<String, dynamic>?> getCachedRoute(String sourceId, String targetId) async {
    final id = '${sourceId}_$targetId';
    final db = await database;
    if (db == null) {
      return _inMemoryCachedRoutes[id];
    }

    final list = await db.query('cached_routes', where: 'id = ?', whereArgs: [id]);
    return list.isNotEmpty ? list.first : null;
  }

  /// Records locally reported obstacle in SQLite
  Future<void> recordBlockedObstacle(String edgeId, String reason) async {
    final row = {
      'edge_id': edgeId,
      'reason': reason,
      'reported_at': DateTime.now().millisecondsSinceEpoch,
    };

    final db = await database;
    if (db == null) {
      _inMemoryBlockedObstacles[edgeId] = BlockedPathReport(
        edgeId: edgeId,
        reason: reason,
        timestamp: row['reported_at'] as int,
      );
      return;
    }

    await db.insert('blocked_obstacles', row, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  /// Clears all local obstacles from SQLite
  Future<void> clearAllObstacles() async {
    final db = await database;
    if (db == null) {
      _inMemoryBlockedObstacles.clear();
      return;
    }
    await db.delete('blocked_obstacles');
  }

  void _seedMemorySafePoints() {
    _inMemorySafePoints['node_main_gate'] = {
      'id': 'node_main_gate',
      'name': 'Campus Main Gate (Checkpost)',
      'latitude': 9.5747,
      'longitude': 77.6815,
      'type': 'Security Guard Post & SOS Beacon',
    };
    _inMemorySafePoints['node_health_center'] = {
      'id': 'node_health_center',
      'name': '24/7 Campus Medical Clinic',
      'latitude': 9.5750,
      'longitude': 77.6835,
      'type': '24/7 First Aid & Medical Clinic',
    };
    _inMemorySafePoints['node_police_booth'] = {
      'id': 'node_police_booth',
      'name': 'East Campus Police Outpost',
      'latitude': 9.5768,
      'longitude': 77.6838,
      'type': 'Police Outpost & Verified Safe Haven',
    };
  }

  /// Saves raw OpenStreetMap tile bytes to offline SQLite storage
  Future<void> saveTile(String key, int z, int x, int y, Uint8List bytes) async {
    final db = await database;
    if (db == null) {
      _inMemoryMapTiles[key] = bytes;
      return;
    }

    await db.insert(
      'map_tiles',
      {
        'tile_key': key,
        'z': z,
        'x': x,
        'y': y,
        'tile_bytes': bytes,
        'cached_at': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Retrieves an offline cached map tile from SQLite storage
  Future<Uint8List?> getTile(String key) async {
    final db = await database;
    if (db == null) {
      return _inMemoryMapTiles[key];
    }

    final rows = await db.query(
      'map_tiles',
      columns: ['tile_bytes'],
      where: 'tile_key = ?',
      whereArgs: [key],
      limit: 1,
    );

    if (rows.isNotEmpty) {
      return rows.first['tile_bytes'] as Uint8List?;
    }
    return null;
  }

  /// Returns total count of offline cached map tiles stored locally
  Future<int> getCachedTileCount() async {
    final db = await database;
    if (db == null) {
      return _inMemoryMapTiles.length;
    }

    final count = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM map_tiles'),
    );
    return count ?? 0;
  }

  /// Converts longitude to OSM tile X coordinate
  static int lon2tile(double lon, int zoom) {
    return ((lon + 180.0) / 360.0 * (1 << zoom)).floor();
  }

  /// Converts latitude to OSM tile Y coordinate
  static int lat2tile(double lat, int zoom) {
    final latRad = lat * math.pi / 180.0;
    return ((1.0 - math.log(math.tan(latRad) + 1.0 / math.cos(latRad)) / math.pi) / 2.0 * (1 << zoom)).floor();
  }

  /// Downloads and caches regional OSM map tiles into offline SQLite storage
  Future<int> downloadAndCacheRegionTiles({
    required double centerLat,
    required double centerLon,
    int radius = 1,
  }) async {
    int downloadedCount = 0;
    final zooms = [15, 16];

    for (final z in zooms) {
      final centerX = lon2tile(centerLon, z);
      final centerY = lat2tile(centerLat, z);

      for (int dx = -radius; dx <= radius; dx++) {
        for (int dy = -radius; dy <= radius; dy++) {
          final x = centerX + dx;
          final y = centerY + dy;
          final tileKey = 'osm_${z}_${x}_$y';

          try {
            final uri = Uri.parse('https://tile.openstreetmap.org/$z/$x/$y.png');
            final response = await http.get(
              uri,
              headers: {'User-Agent': 'ResQPath-OfflineMapper/1.0 (contact@routemate.app)'},
            ).timeout(const Duration(seconds: 4));

            if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
              await saveTile(tileKey, z, x, y, response.bodyBytes);
              downloadedCount++;
            }
          } catch (e) {
            debugPrint('Tile download failed for ($z, $x, $y): $e');
          }
        }
      }
    }
    return downloadedCount;
  }

  /// Clears all offline map tiles from local storage
  Future<void> clearAllCachedTiles() async {
    final db = await database;
    if (db == null) {
      _inMemoryMapTiles.clear();
      return;
    }
    await db.delete('map_tiles');
  }
}
