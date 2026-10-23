import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import '../models/models.dart';

class LocationService {
  // Default fallback coordinates (Campus reference point from design)
  static final LocationCoordinate defaultLocation = LocationCoordinate(
    latitude: 9.5747,
    longitude: 77.6815,
    accuracy: 5.0,
    cityName: 'Campus (Offline Demo)',
  );

  /// Verifies hardware GPS status and requests runtime permissions from user.
  /// Works across Android, iOS, and Web HTML5 Geolocation.
  static Future<bool> ensurePermission() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        debugPrint('Location hardware services are disabled on device.');
        return false;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          debugPrint('Location permission denied by user.');
          return false;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        debugPrint('Location permission permanently denied.');
        return false;
      }

      return true;
    } catch (e) {
      debugPrint('ensurePermission platform fallback: $e');
      return false;
    }
  }

  /// Requests permissions and retrieves the user's live physical location
  /// from device GPS hardware or browser HTML5 Geolocation API.
  /// If GPS is unavailable/denied (e.g. desktop PC without GPS), falls back
  /// Requests permissions and retrieves the user's live physical location
  /// from device GPS hardware or browser HTML5 Geolocation API.
  /// If GPS is unavailable/denied (e.g. desktop PC without GPS), falls back
  /// automatically to high-speed network IP Geolocation.
  static Future<LocationCoordinate> getCurrentLocation({String? geoapifyKey}) async {
    double? detectedLat;
    double? detectedLon;
    double? accuracy;
    String? initialCity;

    // 1. Hardware availability & permission resolution
    final hasPermission = await ensurePermission();

    // 2. Attempt High-Accuracy Hardware GPS / Browser Geolocation
    if (hasPermission) {
      try {
        final position = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.best,
          timeLimit: const Duration(seconds: 5),
        );

        debugPrint('Live GPS Lock acquired: ${position.latitude}, ${position.longitude} (±${position.accuracy}m)');
        detectedLat = position.latitude;
        detectedLon = position.longitude;
        accuracy = position.accuracy;
        initialCity = 'Live GPS';
      } catch (e) {
        debugPrint('Direct GPS lock timed out/error: $e. Checking network IP fallback...');
      }
    }

    // 3. Query Local Backend Network Geolocation Endpoint (/api/live-location)
    if (detectedLat == null) {
      try {
        final Uri backendUri = kIsWeb
            ? Uri.base.resolve('/api/live-location')
            : Uri.parse('http://10.0.2.2:3000/api/live-location');

        final res = await http.get(backendUri).timeout(const Duration(seconds: 3));
        if (res.statusCode == 200) {
          final data = json.decode(res.body);
          if (data['success'] == true) {
            detectedLat = (data['latitude'] as num).toDouble();
            detectedLon = (data['longitude'] as num).toDouble();
            accuracy = 40.0;
            initialCity = data['city'] as String? ?? 'Your Area';
            debugPrint('Network Location Acquired: $initialCity ($detectedLat, $detectedLon)');
          }
        }
      } catch (err) {
        debugPrint('Local endpoint location check skipped: $err');
      }
    }

    // 4. Query Direct HTTPS Public IP Geolocation Service
    if (detectedLat == null) {
      try {
        final res = await http.get(Uri.parse('https://freeipapi.com/api/json')).timeout(const Duration(seconds: 3));
        if (res.statusCode == 200) {
          final data = json.decode(res.body);
          final lat = (data['latitude'] as num?)?.toDouble();
          final lon = (data['longitude'] as num?)?.toDouble();
          if (lat != null && lon != null) {
            detectedLat = lat;
            detectedLon = lon;
            accuracy = 100.0;
            initialCity = data['cityName'] as String? ?? 'Your City';
            debugPrint('Public IP Location Acquired: $initialCity ($detectedLat, $detectedLon)');
          }
        }
      } catch (_) {}
    }

    // 5. Fallback if no location found
    if (detectedLat == null || detectedLon == null) {
      return defaultLocation;
    }

    // 6. Enrich with high-accuracy Reverse Geocoding (Geoapify or OpenStreetMap Nominatim)
    String resolvedAddress = initialCity ?? 'Live Location';
    try {
      final geoAddress = await reverseGeocode(detectedLat, detectedLon, geoapifyKey: geoapifyKey);
      if (geoAddress != null && geoAddress.isNotEmpty) {
        resolvedAddress = geoAddress;
      }
    } catch (_) {}

    return LocationCoordinate(
      latitude: detectedLat,
      longitude: detectedLon,
      accuracy: accuracy ?? 10.0,
      cityName: resolvedAddress,
    );
  }

  /// Reverse geocodes coordinates to a human-readable street/neighborhood address.
  /// Uses Geoapify Reverse Geocoding if API key is provided,
  /// otherwise uses OpenStreetMap Nominatim (100% free, open data, no key required).
  static Future<String?> reverseGeocode(double lat, double lon, {String? geoapifyKey}) async {
    // 1. Try Geoapify Reverse Geocoding if key is present
    if (geoapifyKey != null && geoapifyKey.trim().isNotEmpty) {
      try {
        final uri = Uri.parse(
          'https://api.geoapify.com/v1/geocode/reverse?lat=$lat&lon=$lon&format=json&apiKey=${geoapifyKey.trim()}',
        );
        final res = await http.get(uri).timeout(const Duration(seconds: 4));
        if (res.statusCode == 200) {
          final data = json.decode(res.body);
          final results = data['results'] as List?;
          if (results != null && results.isNotEmpty) {
            final first = results.first as Map<String, dynamic>;
            final formatted = first['formatted'] as String?;
            final street = first['street'] as String?;
            final suburb = first['suburb'] as String?;
            final city = first['city'] as String?;

            final parts = <String>[];
            if (street != null && street.isNotEmpty) parts.add(street);
            if (suburb != null && suburb.isNotEmpty) parts.add(suburb);
            if (city != null && city.isNotEmpty) parts.add(city);

            if (parts.isNotEmpty) return parts.join(', ');
            if (formatted != null && formatted.isNotEmpty) return formatted;
          }
        }
      } catch (e) {
        debugPrint('Geoapify reverse geocode error: $e. Falling back to OpenStreetMap Nominatim...');
      }
    }

    // 2. OpenStreetMap Nominatim (100% Free, Open Data, Zero Key Required)
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lon&zoom=18&addressdetails=1',
      );
      final res = await http.get(
        uri,
        headers: {'User-Agent': 'ResQPath-OfflineMapper/1.0 (contact@routemate.app)'},
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        final addr = data['address'] as Map<String, dynamic>?;
        if (addr != null) {
          final road = addr['road'] as String?;
          final suburb = addr['suburb'] as String? ?? addr['neighbourhood'] as String?;
          final city = addr['city'] as String? ?? addr['town'] as String? ?? addr['village'] as String? ?? addr['county'] as String?;

          final parts = <String>[];
          if (road != null && road.isNotEmpty) parts.add(road);
          if (suburb != null && suburb.isNotEmpty) parts.add(suburb);
          if (city != null && city.isNotEmpty) parts.add(city);

          if (parts.isNotEmpty) return parts.join(', ');
        }
        final displayName = data['display_name'] as String?;
        if (displayName != null && displayName.isNotEmpty) {
          final splits = displayName.split(',').map((s) => s.trim()).toList();
          return splits.take(3).join(', ');
        }
      }
    } catch (e) {
      debugPrint('OSM Nominatim reverse geocode error: $e');
    }

    return null;
  }

  /// Live GPS position updates stream for continuous navigation tracking
  static Stream<LocationCoordinate> getPositionStream() {
    try {
      return Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best, // Bypasses cell networks directly to raw GPS satellites
          distanceFilter: 3,               // Reposition mapping cursor every 3rd meter moved
        ),
      ).map((position) {
        return LocationCoordinate(
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          cityName: 'Live Satellite Movement',
        );
      }).handleError((err) {
        debugPrint('LocationService stream error: $err');
        return defaultLocation;
      });
    } catch (e) {
      debugPrint('Failed to initialize position stream: $e');
      return Stream.value(defaultLocation);
    }
  }
}
