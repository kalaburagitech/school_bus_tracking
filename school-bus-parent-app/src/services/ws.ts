import { io, type Socket } from 'socket.io-client';

export function createRealtimeSocket(baseUrl: string, token: string): Socket {
  return io(`${baseUrl}/realtime`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });
}
