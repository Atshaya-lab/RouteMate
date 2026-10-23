import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' hide Path;
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../services/tile_cache_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/live_location_marker.dart';
import '../widgets/sos_floating_button.dart';
import 'searching_radar_screen.dart';
import 'safety_hub_screen.dart';

class HomeMapScreen extends StatefulWidget {
  const HomeMapScreen({Key? key}) : super(key: key);

  @override
  State<HomeMapScreen> createState() => _HomeMapScreenState();
}

class _HomeMapScreenState extends State<HomeMapScreen> {
  late final MapController _mapController;
  LatLng? _lastCenteredPos;

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final userPos = LatLng(state.currentLocation.latitude, state.currentLocation.longitude);
    final offlineRoute = state.currentOfflineRoute;

    // Smoothly pan camera whenever user's live coordinates update or lock is acquired (if Auto-Follow is active)
    if (state.isAutoFollowActive &&
        (_lastCenteredPos == null ||
            _lastCenteredPos!.latitude != userPos.latitude ||
            _lastCenteredPos!.longitude != userPos.longitude)) {
      _lastCenteredPos = userPos;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _mapController.move(userPos, 16.2);
      });
    }

    // Convert offline A* path nodes to LatLng polyline points
    final routePoints = offlineRoute != null && offlineRoute.path.isNotEmpty
        ? offlineRoute.path.map((n) => LatLng(n.latitude, n.longitude)).toList()
        : <LatLng>[];

    return Scaffold(
      body: Stack(
        children: [
          // FlutterMap substrate with OpenStreetMap free vector tiles
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: userPos,
              initialZoom: 16.2,
              onTap: (tapPosition, latLng) {
                state.setManualLocation(latLng.latitude, latLng.longitude);
              },
              onPositionChanged: (camera, hasGesture) {
                if (hasGesture && state.isAutoFollowActive) {
                  state.setAutoFollow(false);
                }
              },
            ),
            children: [
              TileLayer(
                key: ValueKey(state.currentTileUrl),
                urlTemplate: state.currentTileUrl,
                userAgentPackageName: 'com.routemate.app',
                tileProvider: SqliteCachedTileProvider(),
              ),

              // Bundled Regional OpenStreetMap Network (Offline Basemap Layer)
              PolylineLayer(
                polylines: [
                  ...state.regionalOsmFeatures.map((feat) {
                    final points = feat.coordinates
                        .map((c) => LatLng(c[1], c[0]))
                        .toList();
                    return Polyline(
                      points: points,
                      color: const Color(0xFF64748B).withOpacity(0.45),
                      strokeWidth: 3.5,
                    );
                  }),
                ],
              ),

              // Polyline Layer for Bidirectional A* & Dynamic Re-Routing
              if (routePoints.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: routePoints,
                      color: (offlineRoute?.isDynamicReroute ?? false)
                          ? const Color(0xFFEA580C) // Vibrant Orange for Dynamic Detour
                          : AppTheme.secondary, // Emerald Green for Safe Path
                      strokeWidth: 5.0,
                    ),
                  ],
                ),

              // Breadcrumb GPS Trail — purple polyline of where the user has walked
              if (state.breadcrumbTrail.length >= 2)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: List<LatLng>.from(state.breadcrumbTrail),
                      color: const Color(0xFF6366F1),
                      strokeWidth: 4.0,
                    ),
                  ],
                ),

              // Breadcrumb start-point dot marker
              if (state.breadcrumbTrail.isNotEmpty)
                MarkerLayer(
                  markers: [
                    Marker(
                      point: state.breadcrumbTrail.first,
                      width: 16,
                      height: 16,
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFF6366F1),
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                  ],
                ),

              // Safe Points & Shelters Layer (Verified Safe Havens from Graph)
              MarkerLayer(
                markers: [
                  ...state.offlineGraph.nodes.values
                      .where((n) => n.isSafePoint)
                      .map((safeNode) {
                    return Marker(
                      point: LatLng(safeNode.latitude, safeNode.longitude),
                      width: 44,
                      height: 44,
                      child: Tooltip(
                        message: '${safeNode.name}\n${safeNode.safePointType ?? ""}',
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppTheme.primary, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: AppTheme.primary.withOpacity(0.3),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.local_police_rounded,
                            color: AppTheme.primary,
                            size: 22,
                          ),
                        ),
                      ),
                    );
                  }),

                  // User's Live Position Marker — animated Google Maps-style pulsing dot
                  Marker(
                    point: userPos,
                    width: 80,
                    height: 80,
                    child: LiveLocationMarkerWidget(
                      compassHeading: state.compassHeading,
                      accuracyMeters: state.currentLocation.accuracy,
                      hasLiveGpsLock: state.hasLiveGpsLock,
                    ),
                  ),

                  // Nearby Guides Markers
                  ...state.availableGuides.map((guide) {
                    return Marker(
                      point: LatLng(guide.location.latitude, guide.location.longitude),
                      width: 46,
                      height: 46,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppTheme.secondary, width: 2),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.2),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                        child: ClipOval(
                          child: Image.network(
                            guide.avatarUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Icon(
                              Icons.person,
                              color: AppTheme.secondary,
                              size: 24,
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ],
          ),

          // Top Header Floating Navigation & Status Bar
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      // Offline A* Engine Badge Toggle
                      InkWell(
                        onTap: () => state.toggleOfflineMode(),
                        borderRadius: BorderRadius.circular(24),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: (offlineRoute?.isDynamicReroute ?? false)
                                  ? const Color(0xFFEA580C)
                                  : AppTheme.secondary,
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.08),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              Icon(
                                (offlineRoute?.isDynamicReroute ?? false)
                                    ? Icons.alt_route
                                    : Icons.offline_bolt_rounded,
                                color: (offlineRoute?.isDynamicReroute ?? false)
                                    ? const Color(0xFFEA580C)
                                    : AppTheme.secondary,
                                size: 16,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                (offlineRoute?.isDynamicReroute ?? false)
                                    ? 'Dynamic Re-Route'
                                    : 'Offline A* Engine',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: (offlineRoute?.isDynamicReroute ?? false)
                                      ? const Color(0xFFEA580C)
                                      : AppTheme.secondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Real-Time Compass & Live GPS Lock Pill
                      InkWell(
                        onTap: () async {
                          await state.refreshLocation();
                          _mapController.move(userPos, 16.5);
                        },
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: state.hasLiveGpsLock ? AppTheme.secondary : Colors.grey.shade300,
                              width: state.hasLiveGpsLock ? 1.5 : 1.0,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.06),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Transform.rotate(
                                angle: (state.compassHeading) * (math.pi / 180),
                                child: Icon(
                                  Icons.explore,
                                  color: state.hasLiveGpsLock ? AppTheme.secondary : const Color(0xFF0284C7),
                                  size: 16,
                                ),
                              ),
                              const SizedBox(width: 5),
                              Text(
                                '${state.compassHeading.toInt()}° ${state.compassCardinal}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              if (state.hasLiveGpsLock) ...[
                                const SizedBox(width: 5),
                                Container(
                                  width: 7,
                                  height: 7,
                                  decoration: const BoxDecoration(
                                    color: AppTheme.secondary,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Offline SQLite Map Tiles Manager Pill
                      InkWell(
                        onTap: () => _showOfflineMapSheet(context, state),
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: state.cachedTileCount > 0 ? AppTheme.secondary : const Color(0xFF0284C7),
                              width: 1.2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.06),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.save_alt_rounded,
                                color: state.cachedTileCount > 0 ? AppTheme.secondary : const Color(0xFF0284C7),
                                size: 16,
                              ),
                              const SizedBox(width: 5),
                              Text(
                                state.cachedTileCount > 0 ? '${state.cachedTileCount} tiles' : 'Offline Map',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const Spacer(),
                      // Safety Hub Icon Button
                      IconButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const SafetyHubScreen()),
                          );
                        },
                        icon: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.08),
                                blurRadius: 8,
                              ),
                            ],
                          ),
                          child: const Icon(Icons.shield, color: AppTheme.primary, size: 22),
                        ),
                      ),
                      // Role Switcher Button (Traveler <-> Guide)
                      IconButton(
                        tooltip: 'Switch to Guide Dashboard',
                        onPressed: () => state.setUserRole('guide'),
                        icon: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.08),
                                blurRadius: 8,
                              ),
                            ],
                          ),
                          child: const Icon(Icons.swap_horiz, color: AppTheme.secondary, size: 22),
                        ),
                      ),
                    ],
                  ),

                  // Live Location Info Banner
                  Container(
                    margin: const EdgeInsets.only(top: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: state.hasLiveGpsLock ? AppTheme.secondary : const Color(0xFF0284C7),
                        width: 1.2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.06),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        Icon(
                          state.hasLiveGpsLock ? Icons.gps_fixed : Icons.my_location,
                          size: 16,
                          color: state.hasLiveGpsLock ? AppTheme.secondary : const Color(0xFF0284C7),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '📍 Current: ${state.currentLocation.cityName ?? "Live GPS"} (${state.currentLocation.latitude.toStringAsFixed(4)}, ${state.currentLocation.longitude.toStringAsFixed(4)})',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0F172A),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        InkWell(
                          onTap: () async {
                            await state.refreshLocation();
                            _mapController.move(
                              LatLng(state.currentLocation.latitude, state.currentLocation.longitude),
                              16.2,
                            );
                          },
                          child: const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 4),
                            child: Icon(Icons.refresh, size: 16, color: Color(0xFF0284C7)),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Offline Breadcrumb Trail Stats Banner
                  if (state.breadcrumbTrail.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: state.isBreadcrumbRecording ? const Color(0xFF6366F1) : const Color(0xFFE2E8F0),
                          width: 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 6,
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.timeline_rounded,
                            size: 15,
                            color: state.isBreadcrumbRecording ? const Color(0xFF6366F1) : const Color(0xFF64748B),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            state.isBreadcrumbRecording ? 'Recording Trail:' : 'Path Trail:',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: state.isBreadcrumbRecording ? const Color(0xFF6366F1) : const Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            '${state.breadcrumbTrail.length} pts • ${state.breadcrumbDistanceKm.toStringAsFixed(2)} km',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const Spacer(),
                          InkWell(
                            onTap: () => state.clearBreadcrumbTrail(),
                            child: const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              child: Text(
                                'Clear',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.redAccent,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // Dynamic Re-Routing & Hazard Alert Banner (if re-route occurred)
                  if (offlineRoute != null && offlineRoute.isDynamicReroute) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFFDBA74)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.06),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded,
                              color: Color(0xFFEA580C), size: 20),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Text(
                              'Obstacle reported on Library Ave! Dynamically re-routed via Medical Clinic & Police Outpost.',
                              style: TextStyle(
                                color: Color(0xFF9A3412),
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: () => state.resetOfflineBlocks(),
                            child: const Text('Reset', style: TextStyle(fontSize: 12)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),

          // Satellite Auto-Follow, Breadcrumb Trail & Locate Me Floating Controls
          Positioned(
            right: 16,
            bottom: 350,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Map Visual Layers & Style Selector Button
                FloatingActionButton.small(
                  heroTag: 'map_layers_toggle',
                  backgroundColor: Colors.white,
                  tooltip: 'Map Visual Style (${state.activeMapStyleDefinition.name})',
                  onPressed: () => _showMapLayersSheet(context, state),
                  child: const Icon(
                    Icons.layers_rounded,
                    color: Color(0xFF0284C7),
                    size: 20,
                  ),
                ),
                const SizedBox(height: 8),

                // Breadcrumb GPS Trail Recording Toggle
                FloatingActionButton.small(
                  heroTag: 'breadcrumb_toggle',
                  backgroundColor: state.isBreadcrumbRecording ? const Color(0xFF6366F1) : Colors.white,
                  tooltip: state.isBreadcrumbRecording
                      ? 'Stop Trail Recording'
                      : 'Record GPS Breadcrumb Trail',
                  onPressed: () {
                    if (state.isBreadcrumbRecording) {
                      state.stopBreadcrumbRecording();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          duration: const Duration(seconds: 2),
                          backgroundColor: const Color(0xFF6366F1),
                          content: Text(
                            '🛑 Breadcrumb Recording Stopped (${state.breadcrumbTrail.length} pts, ${state.breadcrumbDistanceKm.toStringAsFixed(2)} km)',
                          ),
                        ),
                      );
                    } else {
                      state.startBreadcrumbRecording();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          duration: const Duration(seconds: 2),
                          backgroundColor: Color(0xFF6366F1),
                          content: Text('📍 Recording Offline Breadcrumb Trail...'),
                        ),
                      );
                    }
                  },
                  child: Icon(
                    state.isBreadcrumbRecording ? Icons.stop_rounded : Icons.timeline_rounded,
                    color: state.isBreadcrumbRecording ? Colors.white : const Color(0xFF6366F1),
                    size: 20,
                  ),
                ),
                const SizedBox(height: 8),

                // Satellite Auto-Follow Continuous Cursor Lock
                FloatingActionButton.small(
                  heroTag: 'auto_follow_toggle',
                  backgroundColor: state.isAutoFollowActive ? AppTheme.secondary : Colors.white,
                  tooltip: state.isAutoFollowActive
                      ? 'Satellite Auto-Follow: ON'
                      : 'Satellite Auto-Follow: OFF (Tap to enable auto-centering)',
                  onPressed: () {
                    final next = !state.isAutoFollowActive;
                    state.setAutoFollow(next);
                    if (next) {
                      _mapController.move(userPos, 16.5);
                    }
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        duration: const Duration(seconds: 1),
                        backgroundColor: next ? AppTheme.secondary : const Color(0xFF64748B),
                        content: Text(
                          next
                              ? '🛰️ Satellite Auto-Follow: ON'
                              : '🛰️ Satellite Auto-Follow: OFF (Free Pan Mode)',
                        ),
                      ),
                    );
                  },
                  child: Icon(
                    Icons.radar_rounded,
                    color: state.isAutoFollowActive ? Colors.white : const Color(0xFF64748B),
                    size: 20,
                  ),
                ),
                const SizedBox(height: 8),
                // Locate Me / Recenter to Live Location Floating Button
                FloatingActionButton.small(
                  heroTag: 'recenter_gps',
                  backgroundColor: Colors.white,
                  tooltip: 'Recenter to My Current Location',
                  onPressed: () async {
                    await state.refreshLocation();
                    state.setAutoFollow(true);
                    final currentPos = LatLng(
                      state.currentLocation.latitude,
                      state.currentLocation.longitude,
                    );
                    _mapController.move(currentPos, 16.5);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        duration: const Duration(seconds: 2),
                        backgroundColor: state.hasLiveGpsLock ? AppTheme.secondary : const Color(0xFF0284C7),
                        content: Text(
                          state.hasLiveGpsLock
                              ? '📍 Centered on Live GPS (${currentPos.latitude.toStringAsFixed(4)}, ${currentPos.longitude.toStringAsFixed(4)})'
                              : '📍 Centered on Location (${currentPos.latitude.toStringAsFixed(4)}, ${currentPos.longitude.toStringAsFixed(4)})',
                        ),
                      ),
                    );
                  },
                  child: Icon(
                    state.hasLiveGpsLock ? Icons.my_location : Icons.location_searching,
                    color: state.hasLiveGpsLock ? AppTheme.secondary : const Color(0xFF0284C7),
                    size: 22,
                  ),
                ),
              ],
            ),
          ),

          // Floating SOS Button (Fixed bottom right)
          const Positioned(
            right: 16,
            bottom: 300,
            child: SOSFloatingButton(),
          ),

          // Bottom Request & Re-Route Controller Card
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Destination Row
                  Row(
                    children: [
                      const Icon(Icons.navigation_rounded,
                          color: AppTheme.primaryContainer, size: 22),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              state.destination,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.onSurface,
                              ),
                            ),
                            if (offlineRoute != null)
                              Text(
                                '${offlineRoute.totalDistanceMeters.toInt()}m walk • ${(offlineRoute.safetyScore * 100).toInt()}% Safety Index',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.secondary,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 18, color: Color(0xFFF0F2FF)),

                  // Dynamic Re-Route Simulation Button Row
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            if (offlineRoute?.isDynamicReroute ?? false) {
                              state.resetOfflineBlocks();
                            } else {
                              state.triggerDynamicReroute(
                                blockedEdgeId: 'edge_admin_library',
                                reason: 'Construction barricade / pathway hazard',
                              );
                            }
                          },
                          icon: Icon(
                            (offlineRoute?.isDynamicReroute ?? false)
                                ? Icons.restart_alt
                                : Icons.report_problem_outlined,
                            size: 16,
                            color: (offlineRoute?.isDynamicReroute ?? false)
                                ? AppTheme.primary
                                : const Color(0xFFEA580C),
                          ),
                          label: Text(
                            (offlineRoute?.isDynamicReroute ?? false)
                                ? 'Reset Obstacle'
                                : 'Simulate Blocked Path',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: (offlineRoute?.isDynamicReroute ?? false)
                                  ? AppTheme.primary
                                  : const Color(0xFFEA580C),
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: (offlineRoute?.isDynamicReroute ?? false)
                                  ? AppTheme.primary
                                  : const Color(0xFFFDBA74),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 10),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Escort Mode Selector Pills
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _ModePill(
                        label: 'Audio Guard',
                        icon: Icons.phone_in_talk,
                        isSelected: state.selectedMode == 'call',
                        onTap: () => state.setSelectedMode('call'),
                      ),
                      _ModePill(
                        label: 'Live Chat',
                        icon: Icons.chat_bubble_outline,
                        isSelected: state.selectedMode == 'chat',
                        onTap: () => state.setSelectedMode('chat'),
                      ),
                      _ModePill(
                        label: 'Meetup',
                        icon: Icons.directions_walk,
                        isSelected: state.selectedMode == 'meetup',
                        onTap: () => state.setSelectedMode('meetup'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Search Trigger Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        state.startSearch();
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const SearchingRadarScreen(),
                          ),
                        );
                      },
                      child: const Text('Find Local Guide Escort'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showOfflineMapSheet(BuildContext context, AppState state) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (sheetContext, setModalState) {
            return Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.secondary.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.download_for_offline_rounded, color: AppTheme.secondary, size: 26),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Offline SQLite Map Storage',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                            ),
                            const Text(
                              'Pure-Flutter OSM Engine • Zero Corporate APIs',
                              style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Cached Map Tiles in SQLite:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: state.cachedTileCount > 0 ? AppTheme.secondary.withOpacity(0.15) : const Color(0xFFE2E8F0),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${state.cachedTileCount} tiles',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: state.cachedTileCount > 0 ? AppTheme.secondary : const Color(0xFF475569),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Active Target Region:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                            Text(
                              state.currentLocation.cityName ?? 'Campus Area',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Offline Status:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                            Row(
                              children: [
                                Icon(
                                  state.cachedTileCount > 0 ? Icons.check_circle : Icons.offline_pin,
                                  size: 16,
                                  color: state.cachedTileCount > 0 ? AppTheme.secondary : const Color(0xFF0284C7),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  state.cachedTileCount > 0 ? 'Failsafe Offline Ready' : 'Online OSM Streaming',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: state.cachedTileCount > 0 ? AppTheme.secondary : const Color(0xFF0284C7),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.secondary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: state.isDownloadingTiles
                          ? null
                          : () async {
                              final count = await state.downloadOfflineRegionalMap();
                              setModalState(() {});
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    backgroundColor: AppTheme.secondary,
                                    content: Text('✅ Successfully stored $count regional map tiles into SQLite database!'),
                                  ),
                                );
                              }
                            },
                      icon: state.isDownloadingTiles
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            )
                          : const Icon(Icons.download_rounded, color: Colors.white),
                      label: Text(
                        state.isDownloadingTiles
                            ? 'Downloading Regional Tiles...'
                            : 'Download Current Regional Cluster',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (state.cachedTileCount > 0)
                    SizedBox(
                      width: double.infinity,
                      child: TextButton.icon(
                        style: TextButton.styleFrom(foregroundColor: Colors.red.shade600),
                        onPressed: () async {
                          await state.clearOfflineTileCache();
                          setModalState(() {});
                        },
                        icon: const Icon(Icons.delete_outline, size: 18),
                        label: const Text('Clear SQLite Cached Tiles'),
                      ),
                    ),

                  const SizedBox(height: 14),
                  const Divider(color: Color(0xFFE2E8F0)),
                  const SizedBox(height: 10),

                  // Open Source & Geoapify Basemap Selector
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Map Visuals & Open Data',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                      TextButton.icon(
                        onPressed: () {
                          Navigator.pop(ctx);
                          _showMapLayersSheet(context, state);
                        },
                        icon: const Icon(Icons.layers, size: 16),
                        label: const Text('Change Style', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.style, size: 18, color: AppTheme.secondary),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Active: ${state.activeMapStyleDefinition.name}',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                              ),
                              Text(
                                '${state.activeMapStyleDefinition.providerName} • Free',
                                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),
                  // Geoapify API Key Setting Container
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.vpn_key_rounded, size: 16, color: Color(0xFF6366F1)),
                            const SizedBox(width: 6),
                            const Text(
                              'Geoapify API Key (Optional)',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: state.geoapifyApiKey.isNotEmpty
                                    ? AppTheme.secondary.withOpacity(0.15)
                                    : const Color(0xFFE2E8F0),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                state.geoapifyApiKey.isNotEmpty ? 'Active' : 'Optional',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: state.geoapifyApiKey.isNotEmpty
                                      ? AppTheme.secondary
                                      : const Color(0xFF64748B),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Free 3,000 req/day from geoapify.com for high-res MapLibre Liberty vector tiles & reverse geocoding.',
                          style: TextStyle(fontSize: 10, color: Color(0xFF64748B)),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: SizedBox(
                                height: 36,
                                child: TextField(
                                  controller: TextEditingController(text: state.geoapifyApiKey),
                                  onSubmitted: (val) {
                                    state.setGeoapifyApiKey(val);
                                    setModalState(() {});
                                  },
                                  decoration: InputDecoration(
                                    hintText: 'Paste free key from geoapify.com',
                                    hintStyle: const TextStyle(fontSize: 11),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                                    filled: true,
                                    fillColor: Colors.white,
                                  ),
                                  style: const TextStyle(fontSize: 11),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showMapLayersSheet(BuildContext context, AppState state) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.all(24),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0284C7).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.layers_rounded, color: Color(0xFF0284C7), size: 24),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Map Visual Layers',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                        ),
                        Text(
                          'Select rendering engine & basemap theme',
                          style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              ...state.availableMapStyles.map((style) {
                final isSelected = state.currentMapStyle == style.id;
                final isKeyRequiredAndMissing = style.requiresKey && state.geoapifyApiKey.isEmpty;

                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: InkWell(
                    onTap: () {
                      state.setMapStyle(style.id);
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          duration: const Duration(seconds: 2),
                          backgroundColor: AppTheme.secondary,
                          content: Text('🗺️ Switched to: ${style.name}'),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected ? AppTheme.secondary : const Color(0xFFE2E8F0),
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            style.id.contains('dark')
                                ? Icons.dark_mode_rounded
                                : style.id.contains('geoapify')
                                    ? Icons.bolt_rounded
                                    : Icons.map_rounded,
                            color: isSelected ? AppTheme.secondary : const Color(0xFF64748B),
                            size: 24,
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      style.name,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: isSelected ? AppTheme.secondary : const Color(0xFF0F172A),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: style.requiresKey
                                            ? const Color(0xFFEEF2FF)
                                            : const Color(0xFFECFDF5),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        style.providerName,
                                        style: TextStyle(
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                          color: style.requiresKey
                                              ? const Color(0xFF4F46E5)
                                              : const Color(0xFF059669),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  style.description,
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                ),
                                if (isKeyRequiredAndMissing) ...[
                                  const SizedBox(height: 4),
                                  const Text(
                                    'ℹ️ Will fallback to Voyager until Geoapify key is provided',
                                    style: TextStyle(fontSize: 10, color: Color(0xFFEA580C), fontWeight: FontWeight.w600),
                                  ),
                                ],
                              ],
                            ),
                          ),
                          if (isSelected)
                            const Icon(Icons.check_circle, color: AppTheme.secondary, size: 22)
                          else
                            const Icon(Icons.circle_outlined, color: Color(0xFFCBD5E1), size: 22),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
              const SizedBox(height: 10),
            ],
          ),
        );
      },
    );
  }
}

class _ModePill extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _ModePill({
    required this.label,
    required this.icon,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryContainer : AppTheme.surfaceContainer,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected ? Colors.white : AppTheme.primary,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isSelected ? Colors.white : AppTheme.onSurface,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
