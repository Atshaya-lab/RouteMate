import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/animated_radar_sweep.dart';
import 'guide_matches_screen.dart';

class SearchingRadarScreen extends StatefulWidget {
  const SearchingRadarScreen({Key? key}) : super(key: key);

  @override
  State<SearchingRadarScreen> createState() => _SearchingRadarScreenState();
}

class _SearchingRadarScreenState extends State<SearchingRadarScreen> {
  Timer? _transitionTimer;
  double _currentRadius = 1.0;
  Timer? _radiusExpander;

  @override
  void initState() {
    super.initState();

    // Expand search radius step-by-step
    _radiusExpander = Timer.periodic(const Duration(milliseconds: 1200), (timer) {
      if (_currentRadius < 3.0) {
        setState(() => _currentRadius += 1.0);
      }
    });

    // Automatically navigate to matched guides after radar completes scan
    _transitionTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const GuideMatchesScreen()),
        );
      }
    });
  }

  @override
  void dispose() {
    _transitionTimer?.cancel();
    _radiusExpander?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('Scanning Local Escorts'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            state.cancelSearch();
            Navigator.pop(context);
          },
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 16),
            // Geofence status chip
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.surfaceContainer,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.surfaceContainerHighest),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.radar, color: AppTheme.primary, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'Geofence: ${_currentRadius.toStringAsFixed(1)} km Radius Active',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primary,
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),
            // Animated Radar Sweep Component
            SizedBox(
              width: 300,
              height: 300,
              child: AnimatedRadarSweep(radiusKm: _currentRadius),
            ),
            const Spacer(),
            // Status Info
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32.0),
              child: Column(
                children: [
                  const Text(
                    'Pinging Vetted Local Guides...',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Matching with verified fast-responders near ${state.destination}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppTheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 28),
                  // Cancel Button
                  OutlinedButton(
                    onPressed: () {
                      state.cancelSearch();
                      Navigator.pop(context);
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Text('Cancel Request'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
