import 'package:flutter_test/flutter_test.dart';
import 'package:routemate_flutter/services/compass_service.dart';
import 'package:routemate_flutter/services/offline_map_service.dart';
import 'package:routemate_flutter/services/location_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Mapping, GIS & Positioning Engine Tests', () {
    test('OfflineMapService provides bundled regional OpenStreetMap features', () {
      final osmService = OfflineMapService();
      final features = osmService.getBundledRegionalOsmData();

      expect(features.isNotEmpty, isTrue);
      final featureIds = features.map((f) => f.id).toList();

      expect(featureIds, contains('osm_way_main_avenue'));
      expect(featureIds, contains('osm_way_library_walk'));
      expect(featureIds, contains('osm_way_hostel_trail'));

      final mainAvenue = features.firstWhere((f) => f.id == 'osm_way_main_avenue');
      expect(mainAvenue.isLit, isTrue);
      expect(mainAvenue.coordinates.length, greaterThanOrEqualTo(2));
    });

    test('OfflineMapService formats compass headings to correct cardinal directions', () {
      expect(OfflineMapService.headingToCardinal(0.0), equals('N'));
      expect(OfflineMapService.headingToCardinal(45.0), equals('NE'));
      expect(OfflineMapService.headingToCardinal(90.0), equals('E'));
      expect(OfflineMapService.headingToCardinal(135.0), equals('SE'));
      expect(OfflineMapService.headingToCardinal(180.0), equals('S'));
      expect(OfflineMapService.headingToCardinal(225.0), equals('SW'));
      expect(OfflineMapService.headingToCardinal(270.0), equals('W'));
      expect(OfflineMapService.headingToCardinal(315.0), equals('NW'));
      expect(OfflineMapService.headingToCardinal(360.0), equals('N'));
    });

    test('CompassService initializes safely and provides heading stream', () async {
      final compass = CompassService();
      compass.start();

      expect(compass.currentHeading, isNotNull);
      // Clean shutdown
      compass.stop();
    });

    test('LocationService returns high-accuracy GPS default location for campus', () async {
      final loc = await LocationService.getCurrentLocation();
      expect(loc.latitude, closeTo(9.5747, 0.01));
      expect(loc.longitude, closeTo(77.6815, 0.01));
      expect(loc.accuracy, isNotNull);
    });

    test('OfflineMapService provides MapLibre, OpenStreetMap and Geoapify visual styles', () {
      final styles = OfflineMapService.availableStyles;
      expect(styles.length, greaterThanOrEqualTo(5));

      final styleIds = styles.map((s) => s.id).toList();
      expect(styleIds, contains('voyager'));
      expect(styleIds, contains('osm_standard'));
      expect(styleIds, contains('dark_matter'));
      expect(styleIds, contains('geoapify_liberty'));
      expect(styleIds, contains('geoapify_bright'));

      // Test URL template resolution
      final defaultUrl = OfflineMapService.getEffectiveTileUrl('voyager');
      expect(defaultUrl, contains('cartocdn.com'));

      final geoapifyUrl = OfflineMapService.getEffectiveTileUrl('geoapify_liberty', geoapifyKey: 'TEST_KEY_123');
      expect(geoapifyUrl, contains('apiKey=TEST_KEY_123'));

      // Missing key falls back safely to Voyager
      final fallbackUrl = OfflineMapService.getEffectiveTileUrl('geoapify_liberty', geoapifyKey: '');
      expect(fallbackUrl, contains('cartocdn.com'));
    });
  });
}
