import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart' hide Path;
import '../models/models.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../services/location_service.dart';
import '../services/offline_database_service.dart';
import '../core/offline_navigation/routing_graph.dart';
import '../core/offline_navigation/safety_evaluator.dart';
import '../core/offline_navigation/bidirectional_astar.dart';
import '../core/offline_navigation/dynamic_rerouter.dart';
import '../core/offline_navigation/campus_offline_graph.dart';
import '../services/compass_service.dart';
import '../services/offline_map_service.dart';

class AppState extends ChangeNotifier {
  String _userRole = 'traveler'; // 'traveler' or 'guide'
  LocationCoordinate _currentLocation = LocationService.defaultLocation;
  String _selectedMode = 'call'; // 'call', 'chat', 'meetup'
  double _searchRadiusKm = 2.5;
  String _destination = 'North Residence Halls';

  bool _isSearching = false;
  List<GuideProfile> _availableGuides = [];
  GuideProfile? _selectedGuide;
  ActiveSession? _activeSession;
  bool _isSOSActive = false;
  bool _guideIsOnline = true;

  // Offline Navigation Engine State (Bidirectional A* & Dynamic Rerouter)
  late final RoutingGraph _offlineGraph;
  late final SafetyEvaluator _safetyEvaluator;
  late final BidirectionalAStar _astarEngine;
  late final DynamicRerouter _dynamicRerouter;
  RouteResult? _currentOfflineRoute;
  bool _isOfflineModeActive = false;

  AppState() {
    _offlineGraph = CampusOfflineGraphBuilder.buildDefaultGraph();
    _safetyEvaluator = const SafetyEvaluator(
      config: SafetyConstraintConfig(
        avoidUnlitPaths: true,
        avoidIsolatedConstruction: true,
        requirePedestrianAccess: true,
        blockRestrictedZones: true,
        minimumDataConfidence: 0.7,
      ),
    );
    _astarEngine = BidirectionalAStar(
      graph: _offlineGraph,
      safetyEvaluator: _safetyEvaluator,
    );
    _dynamicRerouter = DynamicRerouter(
      graph: _offlineGraph,
      safetyEvaluator: _safetyEvaluator,
    );

    // Initial safe offline route calculation
    _currentOfflineRoute = _astarEngine.findSafeRoute(
      sourceNodeId: 'node_main_gate',
      targetNodeId: 'node_north_hostels',
    );
  }

  // Getters
  String get userRole => _userRole;
  LocationCoordinate get currentLocation => _currentLocation;
  String get selectedMode => _selectedMode;
  double get searchRadiusKm => _searchRadiusKm;
  String get destination => _destination;
  bool get isSearching => _isSearching;
  List<GuideProfile> get availableGuides => _availableGuides;
  GuideProfile? get selectedGuide => _selectedGuide;
  ActiveSession? get activeSession => _activeSession;
  bool get isSOSActive => _isSOSActive;
  bool get guideIsOnline => _guideIsOnline;

  // GPS & Compass Heading State
  double _compassHeading = 0.0;
  double? _compassAccuracy;
  bool _hasLiveGpsLock = false;
  bool _isAutoFollowActive = true;
  int _cachedTileCount = 0;
  bool _isDownloadingTiles = false;

  // Map Basemap Style (MapLibre Voyager, OSM, Dark Matter, Geoapify)
  String _currentMapStyle = 'geoapify_liberty';
  String _geoapifyApiKey = '608bd3862d0645c299405631497e5f72';

  // Breadcrumb Trail (GPS History Path)
  final List<LatLng> _breadcrumbTrail = [];
  bool _isBreadcrumbRecording = false;
  static const int _maxBreadcrumbPoints = 500; // Limit trail length for performance

  double get compassHeading => _compassHeading;
  double? get compassAccuracy => _compassAccuracy;
  bool get hasLiveGpsLock => _hasLiveGpsLock;
  bool get isAutoFollowActive => _isAutoFollowActive;
  int get cachedTileCount => _cachedTileCount;
  bool get isDownloadingTiles => _isDownloadingTiles;
  String get currentMapStyle => _currentMapStyle;
  String get geoapifyApiKey => _geoapifyApiKey;
  String get currentTileUrl => OfflineMapService.getEffectiveTileUrl(_currentMapStyle, geoapifyKey: _geoapifyApiKey);
  List<MapStyleDefinition> get availableMapStyles => OfflineMapService.availableStyles;
  MapStyleDefinition get activeMapStyleDefinition => OfflineMapService.availableStyles.firstWhere(
        (s) => s.id == _currentMapStyle,
        orElse: () => OfflineMapService.availableStyles.first,
      );
  List<LatLng> get breadcrumbTrail => List.unmodifiable(_breadcrumbTrail);
  bool get isBreadcrumbRecording => _isBreadcrumbRecording;
  String get compassCardinal => OfflineMapService.headingToCardinal(_compassHeading);
  List<OsmFeature> get regionalOsmFeatures => OfflineMapService().getBundledRegionalOsmData();

  // Offline Navigation Getters
  RoutingGraph get offlineGraph => _offlineGraph;
  RouteResult? get currentOfflineRoute => _currentOfflineRoute;
  bool get isOfflineModeActive => _isOfflineModeActive;
  List<BlockedPathReport> get blockedReports => _dynamicRerouter.blockedReports;

  Future<void> initialize() async {
    try {
      SocketService().connect();
    } catch (_) {}

    // 1. Initialize Runtime GPS Permissions & Satellite Tracking
    await LocationService.ensurePermission();
    await refreshLocation();
    await refreshCachedTileCount();
    
    // 2. Initialize Compass & Orientation Sensor
    try {
      CompassService().start();
      CompassService().headingStream.listen((heading) {
        if (heading != null) {
          _compassHeading = heading;
          _compassAccuracy = CompassService().currentAccuracy;
          notifyListeners();
        }
      });
    } catch (_) {}

    // 3. Continuous Live Satellite GPS Stream
    try {
      LocationService.getPositionStream().listen((pos) {
        _currentLocation = pos;
        if (pos.latitude != LocationService.defaultLocation.latitude ||
            pos.longitude != LocationService.defaultLocation.longitude) {
          _hasLiveGpsLock = true;

          // Append to breadcrumb trail if recording is active
          if (_isBreadcrumbRecording) {
            final newPoint = LatLng(pos.latitude, pos.longitude);
            // Only add if moved meaningfully (>2m) from last breadcrumb point
            if (_breadcrumbTrail.isEmpty ||
                const Distance().as(
                      LengthUnit.Meter,
                      _breadcrumbTrail.last,
                      newPoint,
                    ) >
                    2.0) {
              _breadcrumbTrail.add(newPoint);
              // Trim oldest points if trail exceeds max length
              if (_breadcrumbTrail.length > _maxBreadcrumbPoints) {
                _breadcrumbTrail.removeAt(0);
              }
            }
          }
        }
        notifyListeners();
      });
    } catch (_) {}

    notifyListeners();
    try {
      await refreshNearbyGuides();
    } catch (_) {}
  }

  /// Toggles satellite auto-follow camera tracking
  void setAutoFollow(bool active) {
    _isAutoFollowActive = active;
    notifyListeners();
  }

  /// Starts recording GPS breadcrumb trail
  void startBreadcrumbRecording() {
    _isBreadcrumbRecording = true;
    if (_hasLiveGpsLock) {
      _breadcrumbTrail.add(LatLng(_currentLocation.latitude, _currentLocation.longitude));
    }
    notifyListeners();
  }

  /// Stops recording GPS breadcrumb trail
  void stopBreadcrumbRecording() {
    _isBreadcrumbRecording = false;
    notifyListeners();
  }

  /// Clears all recorded breadcrumb trail points
  void clearBreadcrumbTrail() {
    _breadcrumbTrail.clear();
    _isBreadcrumbRecording = false;
    notifyListeners();
  }

  /// Returns total distance walked in km based on breadcrumb trail
  double get breadcrumbDistanceKm {
    if (_breadcrumbTrail.length < 2) return 0.0;
    double total = 0.0;
    final distance = const Distance();
    for (int i = 1; i < _breadcrumbTrail.length; i++) {
      total += distance.as(LengthUnit.Kilometer, _breadcrumbTrail[i - 1], _breadcrumbTrail[i]);
    }
    return total;
  }

  /// Switch active basemap style (MapLibre Voyager, OSM, Dark Matter, Geoapify)
  void setMapStyle(String styleId) {
    _currentMapStyle = styleId;
    notifyListeners();
  }

  /// Updates user-provided Geoapify API key
  void setGeoapifyApiKey(String key) {
    _geoapifyApiKey = key.trim();
    notifyListeners();
  }

  /// Explicitly requests current live location and triggers UI update
  Future<void> refreshLocation() async {
    try {
      final loc = await LocationService.getCurrentLocation(geoapifyKey: _geoapifyApiKey);
      _currentLocation = loc;
      if (loc.latitude != LocationService.defaultLocation.latitude ||
          loc.longitude != LocationService.defaultLocation.longitude) {
        _hasLiveGpsLock = true;
      }
      notifyListeners();
    } catch (_) {}
  }

  /// Refreshes count of offline map tiles cached in local SQLite storage
  Future<void> refreshCachedTileCount() async {
    _cachedTileCount = await OfflineDatabaseService().getCachedTileCount();
    notifyListeners();
  }

  /// Downloads regional OpenStreetMap tiles into offline SQLite storage
  Future<int> downloadOfflineRegionalMap() async {
    _isDownloadingTiles = true;
    notifyListeners();
    try {
      final count = await OfflineDatabaseService().downloadAndCacheRegionTiles(
        centerLat: _currentLocation.latitude,
        centerLon: _currentLocation.longitude,
      );
      await refreshCachedTileCount();
      _isDownloadingTiles = false;
      notifyListeners();
      return count;
    } catch (_) {
      _isDownloadingTiles = false;
      notifyListeners();
      return 0;
    }
  }

  /// Clears offline map tiles from SQLite storage
  Future<void> clearOfflineTileCache() async {
    await OfflineDatabaseService().clearAllCachedTiles();
    await refreshCachedTileCount();
  }

  /// Sets custom pin location and enriches with reverse geocoding
  Future<void> setManualLocation(double lat, double lng) async {
    _currentLocation = LocationCoordinate(
      latitude: lat,
      longitude: lng,
      accuracy: 5.0,
      cityName: 'Pin (${lat.toStringAsFixed(3)}, ${lng.toStringAsFixed(3)})',
    );
    _hasLiveGpsLock = true;
    notifyListeners();
    try {
      final address = await LocationService.reverseGeocode(lat, lng, geoapifyKey: _geoapifyApiKey);
      if (address != null && address.isNotEmpty) {
        _currentLocation = LocationCoordinate(
          latitude: lat,
          longitude: lng,
          accuracy: 5.0,
          cityName: address,
        );
        notifyListeners();
      }
    } catch (_) {}
  }

  void toggleOfflineMode() {
    _isOfflineModeActive = !_isOfflineModeActive;
    if (_isOfflineModeActive && _currentOfflineRoute == null) {
      computeOfflineRoute();
    }
    notifyListeners();
  }

  void computeOfflineRoute({
    String sourceId = 'node_main_gate',
    String targetId = 'node_north_hostels',
  }) {
    _currentOfflineRoute = _astarEngine.findSafeRoute(
      sourceNodeId: sourceId,
      targetNodeId: targetId,
    );
    if (_currentOfflineRoute != null) {
      OfflineDatabaseService().saveCachedRoute(
        sourceId: sourceId,
        targetId: targetId,
        route: _currentOfflineRoute!,
        destinationName: _destination,
      );
    }
    notifyListeners();
  }

  void triggerDynamicReroute({
    String blockedEdgeId = 'edge_admin_library',
    String reason = 'Pathway construction / reported unlit hazard',
  }) {
    _currentOfflineRoute = _dynamicRerouter.reportPathBlockedAndReroute(
      edgeId: blockedEdgeId,
      reason: reason,
      currentSourceNodeId: 'node_main_gate',
      targetNodeId: 'node_north_hostels',
    );
    OfflineDatabaseService().recordBlockedObstacle(blockedEdgeId, reason);
    notifyListeners();
  }

  void resetOfflineBlocks() {
    _dynamicRerouter.clearAllObstacles();
    OfflineDatabaseService().clearAllObstacles();
    computeOfflineRoute();
  }

  void setUserRole(String role) {
    _userRole = role;
    notifyListeners();
  }

  void setSelectedMode(String mode) {
    _selectedMode = mode;
    notifyListeners();
  }

  void setSearchRadius(double radius) {
    _searchRadiusKm = radius;
    notifyListeners();
  }

  void setDestination(String dest) {
    _destination = dest;
    notifyListeners();
  }

  Future<void> refreshNearbyGuides() async {
    _availableGuides = await ApiService.asyncFetchNearbyGuides(
      latitude: _currentLocation.latitude,
      longitude: _currentLocation.longitude,
      radiusKm: _searchRadiusKm,
    );
    notifyListeners();
  }

  Future<void> startSearch() async {
    _isSearching = true;
    notifyListeners();

    await ApiService.createTripRequest(
      destination: _destination,
      pickupLocation: _currentLocation,
      mode: _selectedMode,
      radiusKm: _searchRadiusKm,
    );

    await refreshNearbyGuides();
  }

  void cancelSearch() {
    _isSearching = false;
    notifyListeners();
  }

  void acceptGuide(GuideProfile guide) {
    _selectedGuide = guide;
    _isSearching = false;

    _activeSession = ActiveSession(
      id: 'session-${DateTime.now().millisecondsSinceEpoch}',
      requestId: 'req-01',
      travelerId: 'traveler-user-01',
      guideId: guide.id,
      guide: guide,
      status: 'active',
      mode: _selectedMode,
      startedAt: DateTime.now().millisecondsSinceEpoch,
      destination: _destination,
      currentGuideLocation: guide.location,
      currentTravelerLocation: _currentLocation,
    );

    SocketService().joinSession(_activeSession!.id);
    notifyListeners();
  }

  void endActiveSession() {
    _activeSession = null;
    _selectedGuide = null;
    _isSearching = false;
    notifyListeners();
  }

  Future<void> triggerEmergencySOS() async {
    _isSOSActive = true;
    notifyListeners();

    await ApiService.triggerSOS(
      location: _currentLocation,
      userName: 'Traveler User',
      userPhone: '+91 98765 43210',
    );
  }

  void dismissSOS() {
    _isSOSActive = false;
    notifyListeners();
  }

  void toggleGuideOnline() {
    _guideIsOnline = !_guideIsOnline;
    SocketService().setGuideAvailability('guide-001', _guideIsOnline);
    notifyListeners();
  }
}
