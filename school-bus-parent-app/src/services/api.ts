import AsyncStorage from '@react-native-async-storage/async-storage';
import { withRetry } from './retry';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? '';
const TOKEN_KEY = 'parent.accessToken';

type ParentBusLive = {
  buses: Array<{
    busId: string;
    live: null | { latitude: number; longitude: number; tripId: string; recordedAt: string };
    activeTrip?: { id: string; startedAt: string | null } | null;
  }>;
};

type HistoryResponse = {
  granularity: 'daily' | 'monthly';
  from: string;
  to: string;
  attendance: Array<{
    id: string;
    studentId: string;
    type: 'PICKUP' | 'DROPOFF';
    recordedAt: string;
    student: { id: string; name: string };
  }>;
  summary: { total: number; pickups?: number; dropoffs?: number };
};

function jsonHeaders(token?: string): Record<string, string> {
  const out: Record<string, string> = { 'content-type': 'application/json' };
  if (token) out.authorization = `Bearer ${token}`;
  if (TENANT_ID) out['x-tenant-id'] = TENANT_ID;
  return out;
}

async function request<T>(path: string, init: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...jsonHeaders(token), ...(init.headers as Record<string, string> | undefined) },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${path}: ${await response.text()}`);
  }
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

export async function fetchParentBusLive(token: string): Promise<ParentBusLive> {
  return withRetry(() => request('/parent/bus/live', { method: 'GET' }, token), { retries: 2 });
}

export async function fetchHistory(token: string, from: Date, to: Date): Promise<HistoryResponse> {
  return withRetry(
    () =>
      request(
        `/parent/history?from=${from.toISOString()}&to=${to.toISOString()}&granularity=daily`,
        { method: 'GET' },
        token,
      ),
    { retries: 2 },
  );
}

export type ParentContext = {
  students: Array<{
    id: string;
    name: string;
    studentClass?: string | null;
    busId?: string | null;
    bus?: { id: string; registrationNumber: string; busNumber: string | null } | null;
  }>;
};

export async function getParentContext(token: string): Promise<ParentContext> {
  return withRetry(() => request('/parent/me', { method: 'GET' }, token), { retries: 3 });
}
