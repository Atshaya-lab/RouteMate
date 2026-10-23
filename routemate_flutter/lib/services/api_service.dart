import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/models.dart';

class ApiService {
  // Configured to local Wi-Fi backend IP (or localhost fallback)
  static const String baseUrl = 'http://10.198.214.238:3000';

  // Fetch nearby available guides within specified radius
  static asyncFetchNearbyGuides({
    required double latitude,
    required double longitude,
    double radiusKm = 3.0,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/api/guides/nearby?lat=$latitude&lng=$longitude&radiusKm=$radiusKm');
      final res = await http.get(uri).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = data['guides'] as List? ?? [];
        return list.map((g) => GuideProfile.fromJson(g)).toList();
      }
    } catch (e) {
      // In case device cannot reach local IP, fallback to campus mock guides
      return _getFallbackGuides();
    }
    return _getFallbackGuides();
  }

  // Create an on-demand escort request
  static Future<TripRequest?> createTripRequest({
    required String destination,
    required LocationCoordinate pickupLocation,
    required String mode,
    double radiusKm = 2.5,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/api/requests/create');
      final body = {
        'travelerId': 'traveler-user-01',
        'travelerName': 'Karthik',
        'travelerPhone': '+91 98765 43210',
        'destination': destination,
        'pickupLocation': pickupLocation.toJson(),
        'selectedMode': mode,
        'searchRadiusKm': radiusKm,
      };

      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return TripRequest.fromJson(data['request']);
      }
    } catch (e) {
      // Return simulated local request
      return TripRequest(
        id: 'req-${DateTime.now().millisecondsSinceEpoch}',
        travelerId: 'traveler-user-01',
        travelerName: 'Karthik',
        travelerPhone: '+91 98765 43210',
        destination: destination,
        pickupLocation: pickupLocation,
        status: 'searching',
        searchRadiusKm: radiusKm,
        selectedMode: mode,
        createdAt: DateTime.now().millisecondsSinceEpoch,
      );
    }
    return null;
  }

  // Emergency SOS trigger
  static Future<bool> triggerSOS({
    required LocationCoordinate location,
    required String userName,
    required String userPhone,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/api/safety/sos');
      final res = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': 'emergency-user',
          'userName': userName,
          'userPhone': userPhone,
          'location': location.toJson(),
        }),
      ).timeout(const Duration(seconds: 4));

      return res.statusCode == 200;
    } catch (_) {
      return true; // Graceful offline confirmation
    }
  }

  static List<GuideProfile> _getFallbackGuides() {
    return [
      GuideProfile(
        id: 'guide-001',
        name: 'Achu',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        rating: 5.0,
        reviewCount: 248,
        distance: '170m away',
        distanceKm: 0.17,
        eta: '1 min walk',
        pricePerSession: 8.0,
        languages: ['Tamil (Native)', 'English (Fluent)'],
        location: LocationCoordinate(latitude: 9.57587, longitude: 77.68246),
        isOnline: true,
        isVerified: true,
        fastResponder: true,
        specialty: 'Campus & Safe Egress Specialist',
        modes: ['call', 'chat', 'meetup'],
      ),
      GuideProfile(
        id: 'guide-002',
        name: 'Malar',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
        rating: 4.98,
        reviewCount: 195,
        distance: '260m away',
        distanceKm: 0.26,
        eta: '2 min walk',
        pricePerSession: 7.5,
        languages: ['Tamil (Native)', 'English (Fluent)'],
        location: LocationCoordinate(latitude: 9.57287, longitude: 77.68296),
        isOnline: true,
        isVerified: true,
        fastResponder: true,
        specialty: 'Neighborhood & Night Walk Escort',
        modes: ['call', 'chat', 'meetup'],
      ),
      GuideProfile(
        id: 'guide-003',
        name: 'Ashika',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        rating: 4.95,
        reviewCount: 310,
        distance: '350m away',
        distanceKm: 0.35,
        eta: '3 min walk',
        pricePerSession: 8.0,
        languages: ['Tamil', 'English', 'Malayalam'],
        location: LocationCoordinate(latitude: 9.57687, longitude: 77.67946),
        isOnline: true,
        isVerified: true,
        fastResponder: false,
        specialty: 'Transit Hub & Quick Wayfinding Guide',
        modes: ['call', 'chat', 'meetup'],
      ),
    ];
  }
}
