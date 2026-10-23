import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../core/offline_navigation/routing_graph.dart';

/// Represents a regional OpenStreetMap geographic feature extracted for offline use.
class OsmFeature {
  final String id;
  final String name;
  final String type; // 'road', 'footway', 'building', 'safe_zone'
  final bool isLit;
  final double lengthMeters;
  final List<List<double>> coordinates; // [[lng, lat], ...]

  const OsmFeature({
    required this.id,
    required this.name,
    required this.type,
    required this.isLit,
    required this.lengthMeters,
    required this.coordinates,
  });

  factory OsmFeature.fromJson(Map<String, dynamic> json) {
    return OsmFeature(
      id: json['id'] as String,
      name: json['name'] as String,
      type: json['type'] as String,
      isLit: json['is_lit'] as bool? ?? false,
      lengthMeters: (json['length_meters'] as num?)?.toDouble() ?? 0.0,
      coordinates: (json['coordinates'] as List)
          .map((coord) => (coord as List).map((n) => (n as num).toDouble()).toList())
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'type': type,
    'is_lit': isLit,
    'length_meters': lengthMeters,
    'coordinates': coordinates,
  };
}

/// Represents a selectable map visual style (MapLibre, OpenStreetMap, or Geoapify).
class MapStyleDefinition {
  final String id;
  final String name;
  final String description;
  final String urlTemplate;
  final bool requiresKey;
  final String providerName;

  const MapStyleDefinition({
    required this.id,
    required this.name,
    required this.description,
    required this.urlTemplate,
    this.requiresKey = false,
    required this.providerName,
  });
}

/// Service managing MapLibre offline display capabilities and
/// regional OpenStreetMap data bundles for low-signal environments.
class OfflineMapService {
  static final OfflineMapService _instance = OfflineMapService._internal();
  factory OfflineMapService() => _instance;
  OfflineMapService._internal();

  /// Available map rendering styles combining OpenStreetMap, MapLibre, and Geoapify
  static const List<MapStyleDefinition> availableStyles = [
    MapStyleDefinition(
      id: 'voyager',
      name: 'MapLibre Voyager',
      providerName: 'MapLibre / Carto (Free)',
      description: 'Clean, high-contrast modern visuals with clear road hierarchy and pedestrian walkways.',
      urlTemplate: 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      requiresKey: false,
    ),
    MapStyleDefinition(
      id: 'osm_standard',
      name: 'OpenStreetMap Standard',
      providerName: 'OpenStreetMap (Free)',
      description: 'Classic open-data community map tiles directly from OpenStreetMap servers.',
      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      requiresKey: false,
    ),
    MapStyleDefinition(
      id: 'dark_matter',
      name: 'Safety Dark Matter',
      providerName: 'MapLibre / Carto (Free)',
      description: 'High-contrast emergency night mode, ideal for low-light safety and battery saving.',
      urlTemplate: 'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
      requiresKey: false,
    ),
    MapStyleDefinition(
      id: 'geoapify_liberty',
      name: 'Geoapify MapLibre Liberty',
      providerName: 'Geoapify (Free Key)',
      description: 'Vector-rendered MapLibre Liberty style with building footprints and POIs.',
      urlTemplate: 'https://maps.geoapify.com/v1/tile/osm-liberty/{z}/{x}/{y}.png?apiKey={apiKey}',
      requiresKey: true,
    ),
    MapStyleDefinition(
      id: 'geoapify_bright',
      name: 'Geoapify OSM Bright',
      providerName: 'Geoapify (Free Key)',
      description: 'Vibrant, high-resolution retinal map tiles for maximum clarity.',
      urlTemplate: 'https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey={apiKey}',
      requiresKey: true,
    ),
  ];

  /// Resolves the actual tile URL template taking the Geoapify API key into account
  static String getEffectiveTileUrl(String styleId, {String? geoapifyKey}) {
    final style = availableStyles.firstWhere(
      (s) => s.id == styleId,
      orElse: () => availableStyles.first,
    );
    if (style.requiresKey) {
      if (geoapifyKey != null && geoapifyKey.trim().isNotEmpty) {
        return style.urlTemplate.replaceAll('{apiKey}', geoapifyKey.trim());
      }
      // Graceful fallback to MapLibre Voyager if key not entered yet
      return availableStyles.first.urlTemplate;
    }
    return style.urlTemplate;
  }

  /// MapLibre Style Specification for dark/high-contrast emergency safety mode
  static const String mapLibreStyleOffline = '''
  {
    "version": 8,
    "name": "RouteMate-Safety-Dark",
    "sources": {
      "osm-regional-tiles": {
        "type": "raster",
        "tiles": [
          "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        ],
        "tileSize": 256,
        "attribution": "© OpenStreetMap contributors, © CartoDB"
      }
    },
    "layers": [
      {
        "id": "osm-base-layer",
        "type": "raster",
        "source": "osm-regional-tiles",
        "minzoom": 0,
        "maxzoom": 19
      }
    ]
  }
  ''';

  /// Pre-bundled Regional OpenStreetMap Dataset (Extracted GeoJSON features)
  /// for campus network and surrounding corridors.
  List<OsmFeature> getBundledRegionalOsmData() {
    return const [
      OsmFeature(
        id: 'osm_way_main_avenue',
        name: 'University Main Boulevard (Well-Lit)',
        type: 'road',
        isLit: true,
        lengthMeters: 450.0,
        coordinates: [
          [77.6815, 9.5747],
          [77.6820, 9.5755],
          [77.6822, 9.5762],
        ],
      ),
      OsmFeature(
        id: 'osm_way_library_walk',
        name: 'Central Library Pedestrian Walkway',
        type: 'footway',
        isLit: true,
        lengthMeters: 280.0,
        coordinates: [
          [77.6822, 9.5762],
          [77.6825, 9.5768],
          [77.6830, 9.5772],
        ],
      ),
      OsmFeature(
        id: 'osm_way_hostel_trail',
        name: 'North Hostel Campus Perimeter Path',
        type: 'footway',
        isLit: true,
        lengthMeters: 380.0,
        coordinates: [
          [77.6830, 9.5772],
          [77.6830, 9.5780],
        ],
      ),
      OsmFeature(
        id: 'osm_way_clinic_access',
        name: 'Health Center Emergency Vehicle Access',
        type: 'road',
        isLit: true,
        lengthMeters: 180.0,
        coordinates: [
          [77.6822, 9.5762],
          [77.6835, 9.5750],
        ],
      ),
    ];
  }

  /// Converts a compass heading in degrees (0 - 360) to a cardinal / intercardinal string
  static String headingToCardinal(double heading) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    final normalized = (heading % 360 + 360) % 360;
    final index = ((normalized + 22.5) / 45).floor() % 8;
    return directions[index];
  }
}
