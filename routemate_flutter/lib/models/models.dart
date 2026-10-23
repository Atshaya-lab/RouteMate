class LocationCoordinate {
  final double latitude;
  final double longitude;
  final double? accuracy;
  final String? cityName;

  LocationCoordinate({
    required this.latitude,
    required this.longitude,
    this.accuracy,
    this.cityName,
  });

  factory LocationCoordinate.fromJson(Map<String, dynamic> json) {
    return LocationCoordinate(
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      accuracy: json['accuracy'] != null ? (json['accuracy'] as num).toDouble() : null,
      cityName: json['cityName'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'latitude': latitude,
    'longitude': longitude,
    if (accuracy != null) 'accuracy': accuracy,
    if (cityName != null) 'cityName': cityName,
  };
}

class GuideProfile {
  final String id;
  final String name;
  final String avatarUrl;
  final double rating;
  final int reviewCount;
  final String distance;
  final double distanceKm;
  final String eta;
  final double pricePerSession;
  final List<String> languages;
  final LocationCoordinate location;
  final bool isOnline;
  final bool isVerified;
  final bool fastResponder;
  final String specialty;
  final List<String> modes;

  GuideProfile({
    required this.id,
    required this.name,
    required this.avatarUrl,
    required this.rating,
    required this.reviewCount,
    required this.distance,
    required this.distanceKm,
    required this.eta,
    required this.pricePerSession,
    required this.languages,
    required this.location,
    required this.isOnline,
    required this.isVerified,
    required this.fastResponder,
    required this.specialty,
    required this.modes,
  });

  factory GuideProfile.fromJson(Map<String, dynamic> json) {
    return GuideProfile(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'Guide',
      avatarUrl: json['avatarUrl'] as String? ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
      distance: json['distance'] as String? ?? 'Nearby',
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 0.2,
      eta: json['eta'] as String? ?? '2 min walk',
      pricePerSession: (json['pricePerSession'] as num?)?.toDouble() ?? 8.0,
      languages: json['languages'] is List
          ? List<String>.from(json['languages'])
          : (json['languages'] as String? ?? 'Tamil, English').split(' '),
      location: json['location'] is Map<String, dynamic>
          ? LocationCoordinate.fromJson(json['location'])
          : LocationCoordinate(latitude: 9.57587, longitude: 77.68246),
      isOnline: json['isOnline'] as bool? ?? true,
      isVerified: json['isVerified'] as bool? ?? true,
      fastResponder: json['fastResponder'] as bool? ?? false,
      specialty: json['specialty'] as String? ?? 'Local Wayfinding Guide',
      modes: json['modes'] is List
          ? List<String>.from(json['modes'])
          : ['call', 'chat', 'meetup'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'avatarUrl': avatarUrl,
    'rating': rating,
    'reviewCount': reviewCount,
    'distance': distance,
    'distanceKm': distanceKm,
    'eta': eta,
    'pricePerSession': pricePerSession,
    'languages': languages,
    'location': location.toJson(),
    'isOnline': isOnline,
    'isVerified': isVerified,
    'fastResponder': fastResponder,
    'specialty': specialty,
    'modes': modes,
  };
}

class TripRequest {
  final String id;
  final String travelerId;
  final String travelerName;
  final String travelerPhone;
  final String destination;
  final LocationCoordinate pickupLocation;
  final String status;
  final double searchRadiusKm;
  final String selectedMode; // 'call', 'chat', 'meetup'
  final int createdAt;

  TripRequest({
    required this.id,
    required this.travelerId,
    required this.travelerName,
    required this.travelerPhone,
    required this.destination,
    required this.pickupLocation,
    required this.status,
    required this.searchRadiusKm,
    required this.selectedMode,
    required this.createdAt,
  });

  factory TripRequest.fromJson(Map<String, dynamic> json) {
    return TripRequest(
      id: json['id'] as String? ?? '',
      travelerId: json['travelerId'] as String? ?? '',
      travelerName: json['travelerName'] as String? ?? 'Traveler',
      travelerPhone: json['travelerPhone'] as String? ?? '',
      destination: json['destination'] as String? ?? 'Destination',
      pickupLocation: json['pickupLocation'] != null
          ? LocationCoordinate.fromJson(json['pickupLocation'])
          : LocationCoordinate(latitude: 9.5747, longitude: 77.6815),
      status: json['status'] as String? ?? 'searching',
      searchRadiusKm: (json['searchRadiusKm'] as num?)?.toDouble() ?? 2.5,
      selectedMode: json['selectedMode'] as String? ?? 'call',
      createdAt: (json['createdAt'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'travelerId': travelerId,
    'travelerName': travelerName,
    'travelerPhone': travelerPhone,
    'destination': destination,
    'pickupLocation': pickupLocation.toJson(),
    'status': status,
    'searchRadiusKm': searchRadiusKm,
    'selectedMode': selectedMode,
    'createdAt': createdAt,
  };
}

class ActiveSession {
  final String id;
  final String requestId;
  final String travelerId;
  final String guideId;
  final GuideProfile guide;
  final String status;
  final String mode;
  final int startedAt;
  final String destination;
  final LocationCoordinate currentGuideLocation;
  final LocationCoordinate currentTravelerLocation;

  ActiveSession({
    required this.id,
    required this.requestId,
    required this.travelerId,
    required this.guideId,
    required this.guide,
    required this.status,
    required this.mode,
    required this.startedAt,
    required this.destination,
    required this.currentGuideLocation,
    required this.currentTravelerLocation,
  });

  factory ActiveSession.fromJson(Map<String, dynamic> json) {
    return ActiveSession(
      id: json['id'] as String? ?? '',
      requestId: json['requestId'] as String? ?? '',
      travelerId: json['travelerId'] as String? ?? '',
      guideId: json['guideId'] as String? ?? '',
      guide: GuideProfile.fromJson(json['guide'] as Map<String, dynamic>? ?? {}),
      status: json['status'] as String? ?? 'active',
      mode: json['mode'] as String? ?? 'call',
      startedAt: (json['startedAt'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
      destination: json['destination'] as String? ?? 'Destination',
      currentGuideLocation: json['currentGuideLocation'] != null
          ? LocationCoordinate.fromJson(json['currentGuideLocation'])
          : LocationCoordinate(latitude: 9.57587, longitude: 77.68246),
      currentTravelerLocation: json['currentTravelerLocation'] != null
          ? LocationCoordinate.fromJson(json['currentTravelerLocation'])
          : LocationCoordinate(latitude: 9.5747, longitude: 77.6815),
    );
  }
}

class ChatMessage {
  final String id;
  final String sessionId;
  final String senderId;
  final String senderName;
  final String text;
  final int timestamp;
  final bool isGuide;

  ChatMessage({
    required this.id,
    required this.sessionId,
    required this.senderId,
    required this.senderName,
    required this.text,
    required this.timestamp,
    required this.isGuide,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String? ?? '',
      sessionId: json['sessionId'] as String? ?? '',
      senderId: json['senderId'] as String? ?? '',
      senderName: json['senderName'] as String? ?? '',
      text: json['text'] as String? ?? '',
      timestamp: (json['timestamp'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
      isGuide: json['isGuide'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'senderId': senderId,
    'senderName': senderName,
    'text': text,
    'timestamp': timestamp,
    'isGuide': isGuide,
  };
}
