import { Injectable, Logger } from '@nestjs/common';
import { AttendanceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RedisService } from '../redis/redis.service';
import {
  TRACKING_EVENT_TYPES,
  type AttendanceKafkaEvent,
  type LocationUpdateEvent,
} from '../kafka/tracking-event.types';

@Injectable()
export class TrackingIngestService {
  private readonly logger = new Logger(TrackingIngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly realtime: RealtimeGateway,
  ) { }

  async processLocationUpdate(event: LocationUpdateEvent): Promise<void> {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: event.tripId,
        tenantId: event.tenantId,
        busId: event.busId,
        status: 'ACTIVE',
      },
    });
    if (!trip) {
      this.logger.warn(`Trip not found or inactive: ${event.tripId}`);
      return;
    }

    try {
      await this.prisma.locationSample.create({
        data: {
          tenantId: event.tenantId,
          tripId: event.tripId,
          latitude: event.latitude,
          longitude: event.longitude,
          recordedAt: new Date(event.recordedAt),
          idempotencyKey: event.idempotencyKey ?? undefined,
        },
      });
    } catch (e: unknown) {
      const code =
        typeof e === 'object' && e !== null && 'code' in e
          ? (e as { code?: string }).code
          : undefined;
      if (code !== 'P2002') {
        throw e;
      }
    }

    const cachePayload = JSON.stringify({
      tripId: event.tripId,
      busId: event.busId,
      latitude: event.latitude,
      longitude: event.longitude,
      recordedAt: event.recordedAt,
    });
    await this.redis.client.set(
      this.redis.liveBusKey(event.tenantId, event.busId),
      cachePayload,
      'EX',
      3600,
    );

    // Append GPS point to trail list (for polyline breadcrumb)
    const trailKey = this.redis.busTrailKey(event.tenantId, event.busId);
    await this.redis.client.lpush(trailKey, cachePayload);
    await this.redis.client.ltrim(trailKey, 0, 99);   // keep last 100 points
    await this.redis.client.expire(trailKey, 14400);  // 4h TTL

    this.logger.debug(
      `location_ingested tenantId=${event.tenantId} busId=${event.busId} tripId=${event.tripId} eventType=${event.type} recordedAt=${event.recordedAt} source=tracking_ingest`,
    );

    this.realtime.emitBusLocation(event.tenantId, event.busId, {
      tripId: event.tripId,
      busId: event.busId,
      latitude: event.latitude,
      longitude: event.longitude,
      recordedAt: event.recordedAt,
    });
  }

  async processAttendanceEvent(event: AttendanceKafkaEvent): Promise<void> {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: event.tripId,
        tenantId: event.tenantId,
        status: 'ACTIVE',
      },
    });
    if (!trip) return;

    const type =
      event.attendanceType === 'PICKUP'
        ? AttendanceType.PICKUP
        : AttendanceType.DROPOFF;

    await this.prisma.attendanceLog.create({
      data: {
        tenantId: event.tenantId,
        tripId: event.tripId,
        studentId: event.studentId,
        type,
        recordedAt: new Date(event.recordedAt),
      },
    });
    this.logger.debug(
      `attendance_ingested tenantId=${event.tenantId} busId=${event.busId} tripId=${event.tripId} eventType=${event.type} recordedAt=${event.recordedAt} source=tracking_ingest`,
    );

    this.realtime.emitAttendance(event.tenantId, event.busId, {
      tripId: event.tripId,
      studentId: event.studentId,
      type: event.attendanceType,
      recordedAt: event.recordedAt,
    });
  }

  buildLocationEvent(params: {
    tenantId: string;
    busId: string;
    tripId: string;
    driverUserId: string;
    latitude: number;
    longitude: number;
    idempotencyKey?: string | null;
    recordedAt?: Date;
  }): LocationUpdateEvent {
    const recordedAt = (params.recordedAt ?? new Date()).toISOString();
    return {
      type: TRACKING_EVENT_TYPES.LOCATION_UPDATE,
      tenantId: params.tenantId,
      busId: params.busId,
      tripId: params.tripId,
      driverUserId: params.driverUserId,
      latitude: params.latitude,
      longitude: params.longitude,
      recordedAt,
      idempotencyKey: params.idempotencyKey ?? null,
    };
  }

  buildAttendanceEvent(params: {
    tenantId: string;
    busId: string;
    tripId: string;
    studentId: string;
    attendanceType: 'PICKUP' | 'DROPOFF';
    recordedAt?: Date;
  }): AttendanceKafkaEvent {
    return {
      type: TRACKING_EVENT_TYPES.ATTENDANCE,
      tenantId: params.tenantId,
      busId: params.busId,
      tripId: params.tripId,
      studentId: params.studentId,
      attendanceType: params.attendanceType,
      recordedAt: (params.recordedAt ?? new Date()).toISOString(),
    };
  }
}
