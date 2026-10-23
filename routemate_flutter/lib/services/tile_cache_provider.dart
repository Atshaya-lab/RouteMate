import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:http/http.dart' as http;
import 'offline_database_service.dart';

/// Antigravity SQLite-backed TileProvider for flutter_map.
///
/// Intercepts every tile request, serves from local SQLite first,
/// and falls back to OSM network only if the tile is not cached.
/// Once fetched from network, auto-saves tile to SQLite for future offline use.
class SqliteCachedTileProvider extends TileProvider {
  final OfflineDatabaseService _db = OfflineDatabaseService();

  @override
  ImageProvider getImage(TileCoordinates coordinates, TileLayer options) {
    return _SqliteTileImageProvider(
      coordinates: coordinates,
      urlTemplate: options.urlTemplate ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      db: _db,
    );
  }

  @override
  void dispose() {
    // Nothing to dispose — SQLite connection is managed as singleton
    super.dispose();
  }
}

/// Async image provider that checks SQLite first, then fetches from network.
class _SqliteTileImageProvider extends ImageProvider<_SqliteTileImageProvider> {
  final TileCoordinates coordinates;
  final String urlTemplate;
  final OfflineDatabaseService db;

  const _SqliteTileImageProvider({
    required this.coordinates,
    required this.urlTemplate,
    required this.db,
  });

  String get _tileKey {
    final stylePrefix = urlTemplate.contains('dark')
        ? 'dark'
        : urlTemplate.contains('voyager')
            ? 'voyager'
            : urlTemplate.contains('geoapify')
                ? 'geoapify'
                : 'osm';
    return '${stylePrefix}_${coordinates.z}_${coordinates.x}_${coordinates.y}';
  }

  String get _tileUrl {
    return urlTemplate
        .replaceAll('{z}', '${coordinates.z}')
        .replaceAll('{x}', '${coordinates.x}')
        .replaceAll('{y}', '${coordinates.y}');
  }

  @override
  Future<_SqliteTileImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture<_SqliteTileImageProvider>(this);
  }

  @override
  ImageStreamCompleter loadImage(
    _SqliteTileImageProvider key,
    ImageDecoderCallback decode,
  ) {
    return MultiFrameImageStreamCompleter(
      codec: _loadCodec(key, decode),
      scale: 1.0,
    );
  }

  Future<ui.Codec> _loadCodec(
    _SqliteTileImageProvider key,
    ImageDecoderCallback decode,
  ) async {
    final bytes = await _loadTileBytes(key);
    final buffer = await ui.ImmutableBuffer.fromUint8List(bytes);
    return decode(buffer);
  }

  Future<Uint8List> _loadTileBytes(_SqliteTileImageProvider key) async {
    // 1. Serve from local SQLite cache first (zero network cost)
    try {
      final cached = await db.getTile(key._tileKey);
      if (cached != null && cached.isNotEmpty) {
        return cached;
      }
    } catch (_) {}

    // 2. Fall back to live OSM tile network
    try {
      final response = await http.get(
        Uri.parse(key._tileUrl),
        headers: {
          'User-Agent': 'ResQPath-OfflineMapper/1.0 (contact@routemate.app)',
        },
      ).timeout(const Duration(seconds: 6));

      if (response.statusCode == 200 && response.bodyBytes.isNotEmpty) {
        // Auto-save fetched tile to SQLite for future offline access
        await db.saveTile(
          key._tileKey,
          key.coordinates.z.toInt(),
          key.coordinates.x.toInt(),
          key.coordinates.y.toInt(),
          response.bodyBytes,
        );
        return response.bodyBytes;
      }
    } catch (e) {
      debugPrint('Tile fetch error (${key._tileUrl}): $e');
    }

    // 3. Return a 1x1 transparent PNG placeholder if completely offline and uncached
    return _transparentTilePng;
  }

  // 1×1 transparent PNG (prevents image load errors when tile is unavailable)
  static final Uint8List _transparentTilePng = Uint8List.fromList([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x62, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82,
  ]);

  @override
  bool operator ==(Object other) =>
      other is _SqliteTileImageProvider &&
      coordinates == other.coordinates &&
      urlTemplate == other.urlTemplate;

  @override
  int get hashCode => Object.hash(coordinates, urlTemplate);
}
