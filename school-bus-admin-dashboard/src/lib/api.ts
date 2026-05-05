import { withRetry } from './retry';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

type LiveBusResponse = Array<{
  bus: {
    id: string;
    registrationNumber: string;
    driver?: { id: string; phone: string } | null;
    students?: Array<{ id: string; name: string }>;
  };
  live: null | {
    tripId: string;
    busId: string;
    latitude: number;
    longitude: number;
    recordedAt: string;
  };
  activeTrip?: { id: string; startedAt: string } | null;
}>;

export async function fetchAdminLiveBuses(
  token: string,
  tenantId?: string,
): Promise<LiveBusResponse> {
  return withRetry(async () => {
    const response = await fetch(`${API_BASE}/admin/buses/live`, {
      headers: {
        authorization: token ? `Bearer ${token}` : '',
        ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    return (await response.json()) as LiveBusResponse;
  });
}
