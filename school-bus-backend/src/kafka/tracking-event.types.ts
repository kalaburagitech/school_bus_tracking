export const TRACKING_EVENT_TYPES = {
  LOCATION_UPDATE: 'LOCATION_UPDATE',
  ATTENDANCE: 'ATTENDANCE',
} as const;

export type TrackingEventType =
  (typeof TRACKING_EVENT_TYPES)[keyof typeof TRACKING_EVENT_TYPES];

export interface LocationUpdateEvent {
  type: typeof TRACKING_EVENT_TYPES.LOCATION_UPDATE;
  tenantId: string;
  busId: string;
  tripId: string;
  driverUserId: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
  idempotencyKey?: string | null;
}

export interface AttendanceKafkaEvent {
  type: typeof TRACKING_EVENT_TYPES.ATTENDANCE;
  tenantId: string;
  busId: string;
  tripId: string;
  studentId: string;
  attendanceType: 'PICKUP' | 'DROPOFF';
  recordedAt: string;
}

export type TrackingEvent = LocationUpdateEvent | AttendanceKafkaEvent;
