import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { startTrip, endTrip as apiEndTrip, sendLocation, sendAttendance, Student } from '../services/api';
import { createRealtimeSocket } from '../services/ws';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export type TripState = {
  token: string;
  tripId: string;
  busId: string;
  latitude: number;
  longitude: number;
  students: Student[];
  staff: Array<{id: string; name: string}>;
  gpsAccuracy?: number;
};

export function useDriverTrackingFlow(token: string | null) {
  const [tripState, setTripState] = useState<TripState | null>(null);
  const [error, setError] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [tripStarting, setTripStarting] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'PICKUP' | 'DROPOFF' | null>>({});
  const queueRef = useRef<Array<{ latitude: number; longitude: number; idempotencyKey: string }>>([]);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const socketRef = useRef<ReturnType<typeof createRealtimeSocket> | null>(null);

  useEffect(() => {
    return () => {
      locationSubRef.current?.remove();
      socketRef.current?.disconnect();
    };
  }, []);

  const beginTrip = useCallback(async () => {
    if (!token) return;
    setTripStarting(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please enable location to track the trip.');
        setTripStarting(false);
        return;
      }

      const started = await startTrip(token);
      const trip = started.trip;

      const initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      const state: TripState = {
        token,
        tripId: trip.id,
        busId: trip.busId,
        latitude: initialLoc.coords.latitude,
        longitude: initialLoc.coords.longitude,
        students: trip.bus?.students ?? trip.students ?? [],
        staff: trip.bus?.staffAssignments?.map((a: any) => a.staff) ?? [],
        gpsAccuracy: initialLoc.coords.accuracy ?? undefined,
      };
      setTripState(state);

      // Setup socket
      if (socketRef.current) socketRef.current.disconnect();
      const socket = createRealtimeSocket(API_BASE_URL, token);
      socketRef.current = socket;
      socket.on('connect', () => socket.emit('subscribe:bus', { busId: trip.busId }));

      // Watch GPS
      locationSubRef.current?.remove();
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        async (loc) => {
          const { latitude, longitude, accuracy } = loc.coords;
          setTripState((s) => s ? { ...s, latitude, longitude, gpsAccuracy: accuracy ?? undefined } : s);

          const idempotencyKey = `${Date.now()}-gps`;
          setSending(true);
          try {
            await sendLocation(token, { tripId: trip.id, latitude, longitude, idempotencyKey });
          } catch (e) {
            queueRef.current.push({ latitude, longitude, idempotencyKey });
          } finally {
            setSending(false);
          }
        },
      );
      locationSubRef.current = sub;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setTripStarting(false);
    }
  }, [token]);

  const endTrip = useCallback(async () => {
    if (!tripState) return;
    try {
      await apiEndTrip(tripState.token, tripState.tripId);
      locationSubRef.current?.remove();
      locationSubRef.current = null;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setTripState(null);
      setAttendanceMap({});
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tripState]);

  const markAttendance = useCallback(
    async (studentId: string, type: 'PICKUP' | 'DROPOFF') => {
      if (!tripState) return;
      setError('');
      try {
        await sendAttendance(tripState.token, { tripId: tripState.tripId, studentId, type });
        setAttendanceMap((prev) => ({ ...prev, [studentId]: type }));
      } catch (e) {
        setError((e as Error).message);
      }
    },
    [tripState],
  );

  return {
    tripState,
    error,
    sending,
    tripStarting,
    attendanceMap,
    pendingQueue: queueRef.current.length,
    beginTrip,
    endTrip,
    markAttendance,
  };
}
