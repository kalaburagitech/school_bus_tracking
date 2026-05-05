'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchAdminLiveBuses } from '@/lib/api';
import { createRealtimeSocket } from '@/lib/ws';

export type LiveBusPoint = {
  busId: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
};

export type LiveBusMeta = {
  registrationNumber: string;
  driverPhone?: string;
  studentsOnboard: number;
  activeTripId?: string;
};

export function useLiveBuses(baseUrl: string, token: string, tenantId?: string) {
  const [lastEventAt, setLastEventAt] = useState<string>('');
  const [busPoints, setBusPoints] = useState<Record<string, LiveBusPoint>>({});
  const [busMeta, setBusMeta] = useState<Record<string, LiveBusMeta>>({});
  const [mode, setMode] = useState<'WS_CONNECTED' | 'POLLING' | 'IDLE'>('IDLE');
  const socket = useMemo(() => createRealtimeSocket(baseUrl, token), [baseUrl, token]);
  const throttleMs = 1500;

  useEffect(() => {
    let pollId: ReturnType<typeof setInterval> | null = null;
    const lastAppliedAt: Record<string, number> = {};

    const pollOnce = async () => {
      try {
        const rows = await fetchAdminLiveBuses(token, tenantId);
        const next: Record<string, LiveBusPoint> = {};
        const nextMeta: Record<string, LiveBusMeta> = {};
        rows.forEach((row) => {
          nextMeta[row.bus.id] = {
            registrationNumber: row.bus.registrationNumber,
            driverPhone: (row.bus.driver as { phone?: string } | undefined)?.phone,
            studentsOnboard: Array.isArray(row.bus.students)
              ? row.bus.students.length
              : 0,
            activeTripId: (row.activeTrip as { id?: string } | null)?.id,
          };
          if (!row.live) return;
          next[row.bus.id] = {
            busId: row.bus.id,
            latitude: row.live.latitude,
            longitude: row.live.longitude,
            recordedAt: row.live.recordedAt,
          };
        });
        setBusPoints(next);
        setBusMeta(nextMeta);
        setLastEventAt(new Date().toISOString());
      } catch {
        // keep retry loop alive
      }
    };

    const startPolling = () => {
      if (pollId) return;
      setMode('POLLING');
      void pollOnce();
      pollId = setInterval(() => {
        void pollOnce();
      }, 12000);
    };

    const stopPolling = () => {
      if (pollId) clearInterval(pollId);
      pollId = null;
    };

    socket.on('connect', async () => {
      setMode('WS_CONNECTED');
      stopPolling();
      const rows = await fetchAdminLiveBuses(token, tenantId);
      rows.forEach((row) => {
        socket.emit('subscribe:bus', { busId: row.bus.id });
      });
    });

    socket.on('disconnect', () => startPolling());
    socket.on(
      'bus:location',
      (payload: {
        busId: string;
        latitude: number;
        longitude: number;
        recordedAt: string;
      }) => {
        const now = Date.now();
        if (
          lastAppliedAt[payload.busId] &&
          now - lastAppliedAt[payload.busId] < throttleMs
        ) {
          return;
        }
        lastAppliedAt[payload.busId] = now;
        setBusPoints((prev) => ({
          ...prev,
          [payload.busId]: payload,
        }));
        setLastEventAt(new Date().toISOString());
      },
    );

    startPolling();
    return () => {
      stopPolling();
      socket.disconnect();
    };
  }, [socket, token, tenantId]);

  return { lastEventAt, busPoints, busMeta, mode };
}
