import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { JwtPayload } from '../common/types/jwt-payload.types';

@Injectable()
export class ParentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) { }

  async getBusLive(user: JwtPayload) {
    if (!user.tenantId) {
      throw new ForbiddenException('Parent must belong to a tenant');
    }
    const tenantId = user.tenantId;

    const students = await this.prisma.student.findMany({
      where: { tenantId, parentUserId: user.sub },
      include: { bus: true },
    });

    const busIds = [
      ...new Set(
        students.map((s) => s.busId).filter((id): id is string => !!id),
      ),
    ];

    const buses = await Promise.all(
      busIds.map(async (busId) => {
        const raw = await this.redis.client.get(
          this.redis.liveBusKey(tenantId, busId),
        );
        let live: Record<string, unknown> | null = null;
        if (raw) {
          try {
            live = JSON.parse(raw) as Record<string, unknown>;
          } catch {
            live = null;
          }
        }
        const trip = await this.prisma.trip.findFirst({
          where: { tenantId, busId, status: 'ACTIVE' },
          orderBy: { startedAt: 'desc' },
        });
        return {
          busId,
          live,
          activeTrip: trip ? { id: trip.id, startedAt: trip.startedAt } : null,
        };
      }),
    );

    return {
      buses,
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        busId: s.busId,
      })),
    };
  }

  async getHistory(
    user: JwtPayload,
    from: Date,
    to: Date,
    granularity: 'daily' | 'monthly' = 'daily',
  ) {
    if (!user.tenantId) {
      throw new ForbiddenException('Parent must belong to a tenant');
    }
    const tenantId = user.tenantId;

    const studentIds = (
      await this.prisma.student.findMany({
        where: { tenantId, parentUserId: user.sub },
        select: { id: true },
      })
    ).map((s) => s.id);

    if (!studentIds.length) {
      return { granularity, from, to, attendance: [], summary: { total: 0 } };
    }

    const attendance = await this.prisma.attendanceLog.findMany({
      where: {
        tenantId,
        studentId: { in: studentIds },
        recordedAt: { gte: from, lte: to },
      },
      orderBy: { recordedAt: 'desc' },
      take: 500,
      include: { student: { select: { id: true, name: true } } },
    });

    const summary = {
      total: attendance.length,
      pickups: attendance.filter((a) => a.type === 'PICKUP').length,
      dropoffs: attendance.filter((a) => a.type === 'DROPOFF').length,
    };

    return { granularity, from, to, attendance, summary };
  }

  async getMyContext(user: JwtPayload) {
    if (!user.tenantId) throw new ForbiddenException('Parent must belong to a tenant');
    const students = await this.prisma.student.findMany({
      where: { tenantId: user.tenantId, parentUserId: user.sub, isDeleted: false },
      include: { bus: { select: { id: true, registrationNumber: true, busNumber: true } } }
    });
    return {
      students: students.map(s => ({
        id: s.id,
        name: s.name,
        studentClass: s.studentClass,
        busId: s.busId,
        bus: s.bus ? { id: s.bus.id, registrationNumber: s.bus.registrationNumber, busNumber: s.bus.busNumber } : null,
      }))
    };
  }
}
