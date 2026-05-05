import AsyncStorage from '@react-native-async-storage/async-storage';
import { withRetry } from './retry';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? '';
const TOKEN_KEY = 'driver.accessToken';

async function request<T>(path: string, init: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.authorization = `Bearer ${token}`;
  if (TENANT_ID) headers['x-tenant-id'] = TENANT_ID;

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status} ${path}: ${text}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function requestOtp(phone: string): Promise<void> {
  await withRetry(
    () => request('/auth/request-otp', { method: 'POST', body: JSON.stringify({ phone }) }),
    { retries: 2 },
  );
}

export async function verifyOtp(phone: string, code: string): Promise<string> {
  const out = await withRetry<{ accessToken: string }>(
    () => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code }) }),
    { retries: 2 },
  );
  await AsyncStorage.setItem(TOKEN_KEY, out.accessToken);
  return out.accessToken;
}

export async function getSavedToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  return AsyncStorage.removeItem(TOKEN_KEY);
}

export type Student = {
  id: string;
  name: string;
  studentClass?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export type StartTripResponse = {
  trip: {
    id: string;
    busId: string;
    startedAt: string | null;
    bus?: {
      registrationNumber: string;
      busNumber?: string;
      route?: { name: string; waypoints?: unknown };
      students?: Student[];
      staffAssignments?: Array<{ staff: { id: string; name: string } }>;
    };
    students?: Student[];
  };
  reused: boolean;
};


export type DriverContext = {
  tripsDone: number;
  bus: {
    id: string;
    registrationNumber: string;
    busNumber: string | null;
    studentsCount: number;
    staffCount: number;
    students: Student[];
    staff: Array<{ id: string; name: string | null }>;
  } | null;
};

export async function getDriverContext(token: string): Promise<DriverContext> {
  return withRetry(
    () => request<DriverContext>('/driver/me', { method: 'GET' }, token),
    { retries: 3 },
  );
}

export async function startTrip(token: string): Promise<StartTripResponse> {
  return withRetry(
    () => request<StartTripResponse>('/driver/trips/start', { method: 'POST', body: '{}' }, token),
    { retries: 3 },
  );
}

export async function endTrip(token: string, tripId: string): Promise<{ ok: boolean }> {
  return withRetry(
    () => request('/driver/trips/end', { method: 'POST', body: JSON.stringify({ tripId }) }, token),
    { retries: 3 },
  );
}

export async function sendLocation(
  token: string,
  payload: { tripId: string; latitude: number; longitude: number; idempotencyKey: string },
): Promise<{ ok: boolean }> {
  return withRetry(
    () => request('/driver/trips/location', { method: 'POST', body: JSON.stringify(payload) }, token),
    { retries: 3 },
  );
}

export async function sendAttendance(
  token: string,
  payload: { tripId: string; studentId: string; type: 'PICKUP' | 'DROPOFF' },
): Promise<{ ok: boolean }> {
  return withRetry(
    () => request('/driver/trips/attendance', { method: 'POST', body: JSON.stringify(payload) }, token),
    { retries: 3 },
  );
}

export async function getStudentsOnBus(token: string, busId: string): Promise<Student[]> {
  try {
    const result = await request<{ students: Student[] }>(
      `/admin/buses/${busId}/students`,
      { method: 'GET' },
      token,
    );
    return result.students ?? [];
  } catch {
    return [];
  }
}
