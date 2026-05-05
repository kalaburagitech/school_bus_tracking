import { useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';

export function useDriverTripSocket(baseUrl: string, token: string, busId: string) {
  const socket = useMemo(
    () => io(`${baseUrl}/realtime`, { auth: { token }, transports: ['websocket'] }),
    [baseUrl, token],
  );

  useEffect(() => {
    socket.on('connect', () => socket.emit('subscribe:bus', { busId }));
    return () => {
      socket.disconnect();
    };
  }, [socket, busId]);

  return socket;
}
