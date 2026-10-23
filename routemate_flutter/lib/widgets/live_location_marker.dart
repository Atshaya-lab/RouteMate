import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart' hide Path;
import '../theme/app_theme.dart';

/// Renders the animated Google Maps-style location dot with:
///   • Pulsing accuracy halo ring (animated)
///   • Solid white-bordered directional puck
///   • Compass bearing rotation cone
///   • Accuracy radius circle (semi-transparent)
class LiveLocationMarkerWidget extends StatefulWidget {
  final double compassHeading;
  final double? accuracyMeters;
  final bool hasLiveGpsLock;

  const LiveLocationMarkerWidget({
    Key? key,
    required this.compassHeading,
    this.accuracyMeters,
    this.hasLiveGpsLock = true,
  }) : super(key: key);

  @override
  State<LiveLocationMarkerWidget> createState() => _LiveLocationMarkerWidgetState();
}

class _LiveLocationMarkerWidgetState extends State<LiveLocationMarkerWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: false);

    _pulseAnimation = CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final baseColor = widget.hasLiveGpsLock
        ? AppTheme.primaryContainer
        : const Color(0xFF0284C7);

    return SizedBox(
      width: 80,
      height: 80,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Outer expanding accuracy halo (animated)
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (_, __) {
              final size = 40.0 + 30.0 * _pulseAnimation.value;
              final opacity = (1.0 - _pulseAnimation.value) * 0.4;
              return Center(
                child: Container(
                  width: size,
                  height: size,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: baseColor.withOpacity(opacity),
                  ),
                ),
              );
            },
          ),

          // Compass heading cone (directional beam)
          Transform.rotate(
            angle: widget.compassHeading * (math.pi / 180),
            child: CustomPaint(
              size: const Size(60, 60),
              painter: _HeadingConePainter(color: baseColor),
            ),
          ),

          // Accuracy radius halo (static, semi-transparent)
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: baseColor.withOpacity(0.15),
              border: Border.all(color: baseColor.withOpacity(0.30), width: 1),
            ),
          ),

          // Center dot — white-bordered colored puck (Google Maps-style)
          Container(
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              color: baseColor,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 3),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.30),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
          ),

          // GPS lock indicator dot in center
          if (widget.hasLiveGpsLock)
            Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white,
              ),
            ),
        ],
      ),
    );
  }
}

class _HeadingConePainter extends CustomPainter {
  final Color color;
  const _HeadingConePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;

    final paint = Paint()
      ..shader = RadialGradient(
        center: Alignment.bottomCenter,
        radius: 1.2,
        colors: [
          color.withOpacity(0.45),
          color.withOpacity(0.0),
        ],
      ).createShader(Rect.fromCenter(center: Offset(cx, cy), width: size.width, height: size.height));

    final path = Path()
      ..moveTo(cx, cy)
      ..lineTo(cx - size.width * 0.22, 0)
      ..quadraticBezierTo(cx, size.height * 0.12, cx + size.width * 0.22, 0)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_HeadingConePainter oldDelegate) => oldDelegate.color != color;
}

/// Draws the breadcrumb trail as a colored polyline with dots at each waypoint.
class BreadcrumbTrailPainter extends CustomPainter {
  final List<LatLng> trail;
  final LatLng mapCenter;
  final double zoom;

  const BreadcrumbTrailPainter({
    required this.trail,
    required this.mapCenter,
    required this.zoom,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (trail.length < 2) return;
    // Trail is painted via the PolylineLayer in flutter_map directly
  }

  @override
  bool shouldRepaint(BreadcrumbTrailPainter oldDelegate) => trail != oldDelegate.trail;
}
