import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_compass/flutter_compass.dart';

/// Service providing magnetic compass heading and device orientation
/// for high-accuracy pedestrian dead-reckoning and map alignment.
class CompassService {
  static final CompassService _instance = CompassService._internal();
  factory CompassService() => _instance;
  CompassService._internal();

  StreamSubscription<CompassEvent>? _compassSubscription;
  final _headingController = StreamController<double?>.broadcast();

  double? _currentHeading = 0.0;
  double? _currentAccuracy;
  bool _isListening = false;

  /// Stream of compass headings in degrees (0 - 360) clockwise from true North
  Stream<double?> get headingStream => _headingController.stream;

  /// Last known compass heading in degrees (0 - 360)
  double? get currentHeading => _currentHeading;

  /// Accuracy of magnetometer reading (in degrees, lower is better)
  double? get currentAccuracy => _currentAccuracy;

  /// Starts listening to device hardware magnetometer/compass
  void start() {
    if (_isListening) return;
    _isListening = true;

    if (kIsWeb) {
      // In web browser preview, simulate or emit fallback heading
      _headingController.add(0.0);
      return;
    }

    try {
      final events = FlutterCompass.events;
      _compassSubscription = events?.listen(
        (CompassEvent event) {
          // heading is null on devices without magnetometer
          _currentHeading = event.heading;
          _currentAccuracy = event.accuracy;
          _headingController.add(_currentHeading);
        },
        onError: (err) {
          debugPrint('CompassService error: $err');
          _currentHeading = 0.0;
          _headingController.add(0.0);
        },
      );
    } catch (e) {
      debugPrint('Failed to initialize FlutterCompass: $e');
      _currentHeading = 0.0;
      _headingController.add(0.0);
    }
  }

  /// Stops compass sensor subscription to preserve battery
  void stop() {
    try {
      _compassSubscription?.cancel();
    } catch (_) {}
    _compassSubscription = null;
    _isListening = false;
  }

  void dispose() {
    stop();
    _headingController.close();
  }
}
