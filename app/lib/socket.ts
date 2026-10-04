import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';
import { TripRequest, LocationCoordinate } from '../types';

class SocketClient {
  private socket: Socket | null = null;

  connect() {
    if (!this.socket) {
      this.socket = io(API_BASE_URL, {
        transports: ['websocket'],
        reconnection: true,
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToIncomingDispatches(callback: (request: TripRequest) => void) {
    const s = this.connect();
    s.on('guide:incoming_request', (data: { request: TripRequest }) => {
      callback(data.request);
    });
    return () => {
      s.off('guide:incoming_request');
    };
  }

  broadcastLiveLocation(sessionId: string, coords: LocationCoordinate) {
    const s = this.connect();
    s.emit('session:location_update', { sessionId, coords });
  }
}

export const socketClient = new SocketClient();
