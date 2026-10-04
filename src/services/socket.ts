import Constants from 'expo-constants';
import { io, Socket } from 'socket.io-client';
import { ChatMessage, LocationCoordinate, TripRequest, ActiveSession } from '../types';

const getSocketServerUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost ||
    (Constants as any).experienceUrl;

  if (hostUri && typeof hostUri === 'string') {
    const clean = hostUri.replace(/^[a-z]+:\/\//, '');
    const ip = clean.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000`;
    }
  }
  return 'http://10.1.1.56:3000';
};

const SOCKET_SERVER_URL = getSocketServerUrl();

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 5000,
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('⚡ RouteMate Socket Connected:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
        console.log('RouteMate Socket Disconnected');
      });

      this.socket.on('connect_error', (err) => {
        console.log('Socket connection warning (local standalone mode active):', err.message);
      });
    }

    return this.socket;
  }

  public joinRoom(room: string) {
    if (this.socket) {
      this.socket.emit('join:room', room);
    }
  }

  public subscribeToRequestRadius(
    requestId: string,
    onRadiusExpanded: (data: { radiusKm: number; respondingGuides: any[] }) => void,
    onRequestAccepted: (data: { session: ActiveSession }) => void
  ): () => void {
    const s = this.connect();
    this.joinRoom(`request:${requestId}`);

    s.on('request:radius_expanded', onRadiusExpanded);
    s.on('request:accepted', onRequestAccepted);

    return () => {
      s.off('request:radius_expanded', onRadiusExpanded);
      s.off('request:accepted', onRequestAccepted);
    };
  }

  public subscribeToGuideIncomingRequests(
    onIncomingRequest: (data: { request: TripRequest; expiresInSeconds: number }) => void
  ): () => void {
    const s = this.connect();
    s.on('guide:incoming_request', onIncomingRequest);

    return () => {
      s.off('guide:incoming_request', onIncomingRequest);
    };
  }

  public subscribeToSession(
    sessionId: string,
    onMessage: (msg: ChatMessage) => void,
    onPeerLocation: (loc: { location: LocationCoordinate; senderId: string }) => void,
    onSessionEnded: () => void
  ): () => void {
    const s = this.connect();
    this.joinRoom(`session:${sessionId}`);

    s.on('session:new_message', onMessage);
    s.on('session:peer_location', onPeerLocation);
    s.on('session:ended', onSessionEnded);

    return () => {
      s.off('session:new_message', onMessage);
      s.off('session:peer_location', onPeerLocation);
      s.off('session:ended', onSessionEnded);
    };
  }

  public sendMessage(sessionId: string, senderId: string, senderName: string, text: string, isGuide: boolean) {
    if (this.socket) {
      this.socket.emit('session:send_message', {
        sessionId,
        senderId,
        senderName,
        text,
        isGuide,
      });
    }
  }

  public sendLocationUpdate(sessionId: string, senderId: string, location: LocationCoordinate) {
    if (this.socket) {
      this.socket.emit('session:location_update', {
        sessionId,
        senderId,
        location,
      });
    }
  }

  public endSession(sessionId: string) {
    if (this.socket) {
      this.socket.emit('session:end', { sessionId });
    }
  }
}

export const socketService = new SocketService();
