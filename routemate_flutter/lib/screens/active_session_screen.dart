import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/sos_floating_button.dart';

class ActiveSessionScreen extends StatefulWidget {
  const ActiveSessionScreen({Key? key}) : super(key: key);

  @override
  State<ActiveSessionScreen> createState() => _ActiveSessionScreenState();
}

class _ActiveSessionScreenState extends State<ActiveSessionScreen> {
  Timer? _ticker;
  int _elapsedSeconds = 0;
  bool _isCallActive = false;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() => _elapsedSeconds++);
      }
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  String _formatDuration(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final session = state.activeSession;
    final guide = state.selectedGuide;

    final travelerPos = LatLng(
      state.currentLocation.latitude,
      state.currentLocation.longitude,
    );

    final guidePos = guide != null
        ? LatLng(guide.location.latitude, guide.location.longitude)
        : LatLng(travelerPos.latitude + 0.001, travelerPos.longitude + 0.001);

    return Scaffold(
      body: Stack(
        children: [
          // Live Escort Substrate Map
          FlutterMap(
            options: MapOptions(
              initialCenter: travelerPos,
              initialZoom: 16.5,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.routemate.app',
              ),
              // Route Line between traveler and guide
              PolylineLayer(
                polylines: [
                  Polyline(
                    points: [travelerPos, guidePos],
                    color: AppTheme.primaryContainer,
                    strokeWidth: 4.0,
                  ),
                ],
              ),
              MarkerLayer(
                markers: [
                  // Traveler Marker
                  Marker(
                    point: travelerPos,
                    width: 50,
                    height: 50,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppTheme.primaryContainer,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                      ),
                      child: const Icon(Icons.person, color: Colors.white, size: 24),
                    ),
                  ),
                  // Guide Marker
                  Marker(
                    point: guidePos,
                    width: 50,
                    height: 50,
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppTheme.secondary,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 3),
                      ),
                      child: const Icon(Icons.shield, color: Colors.white, size: 24),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Top Session Floating Header
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppTheme.secondary.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.lock, color: AppTheme.secondary, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            _formatDuration(_elapsedSeconds),
                            style: const TextStyle(
                              color: AppTheme.secondary,
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            guide?.name ?? 'Companion Guide',
                            style: const TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.onSurface,
                            ),
                          ),
                          const Text(
                            '256-bit Encrypted Telemetry',
                            style: TextStyle(
                              fontSize: 11,
                              color: AppTheme.secondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Audio call toggle
                    IconButton(
                      icon: Icon(
                        _isCallActive ? Icons.call_end : Icons.phone_in_talk,
                        color: _isCallActive ? AppTheme.error : AppTheme.primary,
                      ),
                      onPressed: () {
                        setState(() => _isCallActive = !_isCallActive);
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Floating SOS button
          const Positioned(
            right: 16,
            bottom: 230,
            child: SOSFloatingButton(),
          ),

          // Bottom Session Controller Card
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
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      ClipOval(
                        child: Image.network(
                          guide?.avatarUrl ?? '',
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const Icon(Icons.person, size: 48),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Escorting to ${session?.destination ?? state.destination}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${guide?.distance ?? 'Nearby'} • Rating: ${guide?.rating ?? 5.0}★',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppTheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.secondary,
                      ),
                      onPressed: () {
                        state.endActiveSession();
                        Navigator.popUntil(context, (route) => route.isFirst);
                      },
                      child: const Text('Complete Escort • Arrived Safely'),
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
}
