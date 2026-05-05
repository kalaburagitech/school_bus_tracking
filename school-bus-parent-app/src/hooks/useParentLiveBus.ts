/**
 * useParentLiveBus — Live bus location hook for the parent app.
 * 
 * Strategy (Swiggy-style):
 * 1. Connect WebSocket immediately on mount — best latency
 * 2. Emit 'subscribe:bus' as soon as we have a busId
 * 3. Fall back to HTTP polling every 8s if WS disconnects
 * 4. When location updates arrive, return raw coords; the SCREEN
 *    animates them with AnimatedRegion for smooth movement.
 */
import { useEffect, useRef, useState } from 'react';
import { fetchParentBusLive } from '../services/api';
import { createRealtimeSocket } from '../services/ws';

type BusLocation = {
  latitude: number;
  longitude: number;
  tripId?: string;
  recordedAt?: string;
};

export function useParentLiveBus(baseUrl: string, token: string, busId: string) {
  const [location, setLocation] = useState<BusLocation | null>(null);
  const [status, setStatus] = useState<'WS_CONNECTED' | 'POLLING' | 'IDLE'>('IDLE');
  const [attendance, setAttendance] = useState<'IN' | 'OUT'>('OUT');
  const [activeTrip, setActiveTrip] = useState<{ id: string; startedAt: string | null } | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<ReturnType<typeof createRealtimeSocket> | null>(null);
  const subscribedBusIdRef = useRef<string>('');

  const startPolling = (busId: string, token: string) => {
    if (pollingRef.current) return;
    setStatus('POLLING');
    pollingRef.current = setInterval(async () => {
      try {
        const out = await fetchParentBusLive(token);
        const busInfo = busId ? out.buses.find((b) => b.busId === busId) : out.buses[0];
        if (busInfo?.live) {
          setLocation({
            latitude: busInfo.live.latitude,
            longitude: busInfo.live.longitude,
            tripId: busInfo.live.tripId,
            recordedAt: busInfo.live.recordedAt,
          });
        }
        if (busInfo?.activeTrip) setActiveTrip(busInfo.activeTrip);
      } catch {
        // silent retry
      }
    }, 8000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Initialize WebSocket once with token
  useEffect(() => {
    if (!token) return;
    const socket = createRealtimeSocket(baseUrl, token);
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('WS_CONNECTED');
      stopPolling();
      // Subscribe immediately if we already know the busId
      if (subscribedBusIdRef.current) {
        socket.emit('subscribe:bus', { busId: subscribedBusIdRef.current });
      }
    });

    socket.on('disconnect', () => {
      if (subscribedBusIdRef.current) {
        startPolling(subscribedBusIdRef.current, token);
      }
    });

    socket.on('bus:location', (payload: BusLocation) => {
      setLocation(payload);
    });

    socket.on('bus:trip_start', (payload: { busId: string; tripId: string; startedAt: string }) => {
      setActiveTrip({ id: payload.tripId, startedAt: payload.startedAt });
    });

    socket.on('bus:trip_end', () => {
      setActiveTrip(null);
      setLocation(null);
    });

    socket.on('attendance:update', (payload: { type?: 'PICKUP' | 'DROPOFF' }) => {
      if (payload.type === 'PICKUP') setAttendance('IN');
      if (payload.type === 'DROPOFF') setAttendance('OUT');
    });

    // Start polling as fallback until WS is ready
    startPolling('', token);

    return () => {
      stopPolling();
      socket.disconnect();
    };
  }, [baseUrl, token]);

  // Subscribe to bus channel when busId becomes available (async from /parent/me)
  useEffect(() => {
    if (!busId || busId === subscribedBusIdRef.current) return;
    subscribedBusIdRef.current = busId;

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('subscribe:bus', { busId });
    }

    // Also trigger immediate polling now that we have busId
    if (!pollingRef.current) {
      startPolling(busId, token);
    }
  }, [busId, token]);

  return { location, status, attendance, activeTrip };
}
