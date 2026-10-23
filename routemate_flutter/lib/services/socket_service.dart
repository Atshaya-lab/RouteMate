import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/models.dart';
import 'api_service.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  void connect() {
    if (_socket != null && _isConnected) return;

    try {
      _socket = io.io(
        ApiService.baseUrl,
        io.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .enableReconnection()
            .build(),
      );

      _socket!.onConnect((_) {
        _isConnected = true;
      });

      _socket!.onDisconnect((_) {
        _isConnected = false;
      });
    } catch (_) {}
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
  }

  // Traveler joins session room
  void joinSession(String sessionId) {
    _socket?.emit('session:join', {'sessionId': sessionId});
  }

  // Stream current location
  void updateLocation(String sessionId, LocationCoordinate coords) {
    _socket?.emit('session:location_update', {
      'sessionId': sessionId,
      'coords': coords.toJson(),
    });
  }

  // Send real-time chat
  void sendChatMessage(ChatMessage message) {
    _socket?.emit('session:chat_message', message.toJson());
  }

  // Listen for incoming chat messages
  void onChatMessage(Function(ChatMessage) callback) {
    _socket?.on('session:chat_message', (data) {
      if (data is Map<String, dynamic>) {
        callback(ChatMessage.fromJson(data));
      }
    });
  }

  // Guide online status
  void setGuideAvailability(String guideId, bool isOnline) {
    _socket?.emit('guide:status_change', {
      'guideId': guideId,
      'isOnline': isOnline,
    });
  }
}
