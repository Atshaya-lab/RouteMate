import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';
import 'emergency_takeover_dialog.dart';

class SOSFloatingButton extends StatefulWidget {
  const SOSFloatingButton({Key? key}) : super(key: key);

  @override
  State<SOSFloatingButton> createState() => _SOSFloatingButtonState();
}

class _SOSFloatingButtonState extends State<SOSFloatingButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _progressController;
  Timer? _holdTimer;
  bool _isPressing = false;

  @override
  void initState() {
    super.initState();
    // 1.5-second mechanical hold duration to eliminate false positives
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _progressController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _triggerEmergency();
      }
    });
  }

  void _onPressDown(TapDownDetails _) {
    setState(() => _isPressing = true);
    HapticFeedback.heavyImpact();
    _progressController.forward(from: 0.0);
  }

  void _onPressUp() {
    if (_progressController.status != AnimationStatus.completed) {
      _progressController.reset();
      setState(() => _isPressing = false);
    }
  }

  void _triggerEmergency() {
    HapticFeedback.vibrate();
    context.read<AppState>().triggerEmergencySOS();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const EmergencyTakeoverDialog(),
    );

    _progressController.reset();
    setState(() => _isPressing = false);
  }

  @override
  void dispose() {
    _progressController.dispose();
    _holdTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _onPressDown,
      onTapUp: (_) => _onPressUp(),
      onTapCancel: _onPressUp,
      child: AnimatedBuilder(
        animation: _progressController,
        builder: (context, child) {
          return SizedBox(
            width: 72,
            height: 72,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Circular Progress Indicator for hold delay
                CircularProgressIndicator(
                  value: _isPressing ? _progressController.value : 0.0,
                  strokeWidth: 4.5,
                  valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                  backgroundColor: AppTheme.error.withOpacity(0.3),
                ),
                // Glowing circular SOS button
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppTheme.error,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.error.withOpacity(_isPressing ? 0.8 : 0.4),
                        blurRadius: _isPressing ? 18 : 10,
                        spreadRadius: _isPressing ? 4 : 1,
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.warning_rounded, color: Colors.white, size: 20),
                        Text(
                          'SOS',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
