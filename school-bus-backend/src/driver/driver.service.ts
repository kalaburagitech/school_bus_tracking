import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TripStatus } from '@prisma/client';
import type { JwtPayload } from '../common/types/jwt-payload.types';
import type { EndTripDto } from './dto/end-trip.dto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingIngestService } from '../tracking/tracking-ingest.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import type { PostAttendanceDto } from './dto/post-attendance.dto';
import type { PostLocationDto } from './dto/post-location.dto';

@Injectable()
export class DriverService {
  private readonly logger = new Logger(DriverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaProducerService,
    private readonly trackingIngest: TrackingIngestService,
    private readonly config: ConfigService,
    private readonly realtime: RealtimeGateway,
  ) { }

  private kafkaDisabled(): boolean {
    return this.config.get<boolean>('kafka.disabled', false);
  }


  async getDriverContext(user: JwtPayload) {
    if (!user.tenantId) throw new ForbiddenException('Driver must belong to a tenant');

    // Get stats for today (from midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tripsDone = await this.prisma.trip.count({
      where: {
        tenantId: user.tenantId,
        driverUserId: user.sub,
        status: TripStatus.COMPLETED,
        createdAt: { gte: today }
      }
    });

    const bus = await this.prisma.bus.findFirst({
      where: { tenantId: user.tenantId, driverUserId: user.sub, active: true },
      include: {
        students: true,
        staffAssignments: { include: { staff: true } }
      }
    });

    return {
      tripsDone,
      bus: bus ? {
        id: bus.id,
        registrationNumber: bus.registrationNumber,
        busNumber: bus.busNumber,
        studentsCount: bus.students.length,
        staffCount: bus.staffAssignments.length,
        students: bus.students,
        staff: bus.staffAssignments.map(s => s.staff)
      } : null
    };
  }

  async startTrip(user: JwtPayload, busId?: string) {
    if (!user.tenantId) {
      throw new ForbiddenException('Driver must belong to a tenant');
    }
    const tenantId = user.tenantId;

    const bus = await this.prisma.bus.findFirst({
      where: {
        tenantId,
        driverUserId: user.sub,
        active: true,
        ...(busId ? { id: busId } : {}),
      },
      include: {
        students: true,
        staffAssignments: {
          include: { staff: true },
        },
      },
    });
    if (!bus) {
      throw new NotFoundException('No active bus assigned to this driver');
    }

    const active = await this.prisma.trip.findFirst({
      where: {
        tenantId,
        busId: bus.id,
        status: TripStatus.ACTIVE,
      },
    });
    if (active) {
      this.logger.log(
        `trip_start_reuse tenantId=${tenantId} busId=${bus.id} tripId=${active.id} source=driver_api`,
      );
      return { trip: { ...active, bus }, reused: true };
    }

    const trip = await this.prisma.trip.create({
      data: {
        tenantId,
        busId: bus.id,
        driverUserId: user.sub,
        status: TripStatus.ACTIVE,
        startedAt: new Date(),
      },
    });
    this.logger.log(
      `trip_start_new tenantId=${tenantId} busId=${bus.id} tripId=${trip.id} source=driver_api`,
    );
    return { trip: { ...trip, bus }, reused: false };
  }

  async postLocation(user: JwtPayload, dto: PostLocationDto) {
    if (!user.tenantId) {
      throw new ForbiddenException('Driver must belong to a tenant');
    }
    const tenantId = user.tenantId;

    const trip = await this.prisma.trip.findFirst({
      where: {
        id: dto.tripId,
        tenantId,
        driverUserId: user.sub,
        status: TripStatus.ACTIVE,
      },
      include: { bus: true },
    });
    if (!trip) {
      throw new NotFoundException('Active trip not found');
    }

    const event = this.trackingIngest.buildLocationEvent({
      tenantId,
      busId: trip.busId,
      tripId: trip.id,
      driverUserId: user.sub,
      latitude: dto.latitude,
      longitude: dto.longitude,
      idempotencyKey: dto.idempotencyKey,
    });
    this.logger.debug(
      `location_receive tenantId=${tenantId} busId=${trip.busId} tripId=${trip.id} eventType=${event.type} recordedAt=${event.recordedAt} source=driver_api`,
    );

    if (this.kafkaDisabled()) {
      await this.trackingIngest.processLocationUpdate(event);
    } else {
      await this.kafka.publishTrackingEvent(event);
    }

    return { ok: true as const };
  }

  async postAttendance(user: JwtPayload, dto: PostAttendanceDto) {
    if (!user.tenantId) {
      throw new ForbiddenException('Driver must belong to a tenant');
    }
    const tenantId = user.tenantId;

    const trip = await this.prisma.trip.findFirst({
      where: {
        id: dto.tripId,
        tenantId,
        driverUserId: user.sub,
        status: TripStatus.ACTIVE,
      },
      include: { bus: true },
    });
    if (!trip) {
      throw new NotFoundException('Active trip not found');
    }

    const student = await this.prisma.student.findFirst({
      where: {
        id: dto.studentId,
        tenantId,
        busId: trip.busId,
      },
    });
    if (!student) {
      throw new ForbiddenException('Student is not on this bus');
    }

    const event = this.trackingIngest.buildAttendanceEvent({
      tenantId,
      busId: trip.busId,
      tripId: trip.id,
      studentId: dto.studentId,
      attendanceType: dto.type,
    });
    this.logger.debug(
      `attendance_receive tenantId=${tenantId} busId=${trip.busId} tripId=${trip.id} eventType=${event.type} recordedAt=${event.recordedAt} source=driver_api`,
    );

    if (this.kafkaDisabled()) {
      await this.trackingIngest.processAttendanceEvent(event);
    } else {
      await this.kafka.publishTrackingEvent(event);
    }

    return { ok: true as const };
  }

  async endTrip(user: JwtPayload, dto: EndTripDto) {
    if (!user.tenantId) {
      throw new ForbiddenException('Driver must belong to a tenant');
    }
    const tenantId = user.tenantId;

    const trip = await this.prisma.trip.findFirst({
      where: {
        id: dto.tripId,
        tenantId,
        driverUserId: user.sub,
        status: TripStatus.ACTIVE,
      },
    });
    if (!trip) {
      throw new NotFoundException('Active trip not found');
    }

    const updated = await this.prisma.trip.update({
      where: { id: trip.id },
      data: { status: TripStatus.COMPLETED, endedAt: new Date() },
    });
    this.logger.log(
      `trip_end tenantId=${tenantId} busId=${trip.busId} tripId=${trip.id} source=driver_api`,
    );
    return { trip: updated, ok: true as const };
  }
}
