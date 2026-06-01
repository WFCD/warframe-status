import type { WebSocket } from 'ws';

export interface AliveWebSocket extends WebSocket {
  isAlive: boolean;
}

export interface SocketHandshakeRequest {
  socket?: {
    remoteAddress?: string;
  };
}

export interface SocketClientMessage {
  event?: string;
  packet?: Record<string, unknown>;
}

export interface WorldStateSocketRequest {
  platform?: string;
  language?: string;
}
