import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { resolveEffectiveTenantId } from '../common/tenancy/resolve-effective-tenant';
import type { JwtPayload } from '../common/types/jwt-payload.types';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import type { AdminQueryDto } from './dto/admin-query.dto';
import type { AttendanceQueryDto } from './dto/attendance-query.dto';
import type { CreateBusDto } from './dto/create-bus.dto';
import type { CreateDriverDto } from './dto/create-driver.dto';
import type { CreateStaffDto } from './dto/create-staff.dto';
import type { CreateStudentDto } from './dto/create-student.dto';
import type { PostAssignmentDto } from './dto/post-assignment.dto';
import type { UpsertRouteDto } from './dto/upsert-route.dto';
import type { UpdateBusDto } from './dto/update-bus.dto';
import type { UpdateDriverDto } from './dto/update-driver.dto';
import type { UpdateStaffDto } from './dto/update-staff.dto';
import type { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private tenant(user: JwtPayload, header?: string | string[]): string {
    return resolveEffectiveTenantId(user, header);
  }

  private ensureAdmin(user: JwtPayload) {
    if (user.role !== Role.SCHOOL_ADMIN && user.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException();
    }
  }

  private toPagination(dto: AdminQueryDto) {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  async dashboardSummary(user: JwtPayload, tenantHeader?: string | string[]) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);
    const [totalStudents, activeBuses, activeTrips, drivers, recentAttendance] =
      await Promise.all([
        this.prisma.student.count({ where: { tenantId, isDeleted: false } }),
        this.prisma.bus.count({ where: { tenantId, active: true, isDeleted: false } }),
        this.prisma.trip.count({ where: { tenantId, status: 'ACTIVE' } }),
        this.prisma.user.count({
          where: { tenantId, role: Role.DRIVER, isDeleted: false },
        }),
        this.prisma.attendanceLog.findMany({
          where: { tenantId },
          orderBy: { recordedAt: 'desc' },
          take: 10,
          include: { student: { select: { name: true } }, trip: { select: { busId: true } } },
        }),
      ]);

    return {
      kpis: { totalStudents, activeBuses, activeTrips, drivers },
      recentActivity: recentAttendance.map((r) => ({
        id: r.id,
        type: r.type,
        studentName: r.student.name,
        busId: r.trip.busId,
        recordedAt: r.recordedAt,
      })),
    };
  }

  async listStudents(
    user: JwtPayload,
    query: AdminQueryDto,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);
    const { skip, take, page, pageSize } = this.toPagination(query);

    const where = {
      tenantId,
      isDeleted: false,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { studentClass: { contains: query.search, mode: 'insensitive' as const } },
              {
                parent: {
                  phone: { contains: query.search, mode: 'insensitive' as const },
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          bus: { select: { id: true, registrationNumber: true } },
          parent: { select: { id: true, phone: true, name: true, email: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      this.prisma.student.count({ where }),
    ]);

    return { data: rows, pagination: { total, page, pageSize } };
  }

  async createStudent(
    user: JwtPayload,
    dto: CreateStudentDto,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);

    if (dto.busId) {
      const bus = await this.prisma.bus.findFirst({
        where: { id: dto.busId, tenantId, isDeleted: false },
      });
      if (!bus) throw new BadRequestException('Invalid bus for tenant');
    }

    let parentUserId = dto.parentUserId;

    if (dto.parentPhone) {
      const existingParent = await this.prisma.user.findUnique({
        where: { phone: dto.parentPhone },
      });
      if (existingParent) {
        if (
          existingParent.tenantId !== tenantId ||
          existingParent.role !== Role.PARENT ||
          existingParent.isDeleted
        ) {
          throw new BadRequestException('Parent phone is already registered outside this tenant');
        }
        parentUserId = existingParent.id;
      } else {
        const parent = await this.prisma.user.create({
          data: {
            tenantId,
            role: Role.PARENT,
            phone: dto.parentPhone,
            name: dto.parentName,
            email: dto.parentEmail,
          },
        });
        parentUserId = parent.id;
      }
    }

    if (parentUserId) {
      const parent = await this.prisma.user.findFirst({
        where: {
          id: parentUserId,
          tenantId,
          role: Role.PARENT,
          isDeleted: false,
        },
      });
      if (!parent) throw new BadRequestException('Invalid parent user for tenant');
    }

    return this.prisma.student.create({
      data: {
        tenantId,
        name: dto.name,
        studentClass: dto.studentClass,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        busId: dto.busId,
        parentUserId,
      },
    });
  }

  async updateStudent(
    user: JwtPayload,
    id: string,
    dto: UpdateStudentDto,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);

    const existing = await this.prisma.student.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Student not found');

    let parentUserId = dto.parentUserId;

    if (dto.parentPhone) {
      const existingParent = await this.prisma.user.findUnique({
        where: { phone: dto.parentPhone },
      });
      if (existingParent) {
        if (
          existingParent.tenantId !== tenantId ||
          existingParent.role !== Role.PARENT ||
          existingParent.isDeleted
        ) {
          throw new BadRequestException('Parent phone is already registered outside this tenant');
        }
        parentUserId = existingParent.id;
        await this.prisma.user.update({
          where: { id: existingParent.id },
          data: {
            ...(dto.parentName !== undefined ? { name: dto.parentName || null } : {}),
            ...(dto.parentEmail !== undefined ? { email: dto.parentEmail || null } : {}),
          },
        });
      } else {
        const parent = await this.prisma.user.create({
          data: {
            tenantId,
            role: Role.PARENT,
            phone: dto.parentPhone,
            name: dto.parentName || undefined,
            email: dto.parentEmail || undefined,
          },
        });
        parentUserId = parent.id;
      }
    }

    return this.prisma.student.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.busId !== undefined ? { busId: dto.busId || null } : {}),
        ...(parentUserId !== undefined ? { parentUserId: parentUserId || null } : {}),
        ...(dto.studentClass !== undefined ? { studentClass: dto.studentClass } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
        ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
      },
    });
  }

  async deleteStudent(
    user: JwtPayload,
    id: string,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);

    const existing = await this.prisma.student.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Student not found');

    return this.prisma.student.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async listDrivers(
    user: JwtPayload,
    query: AdminQueryDto,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);
    const { skip, take, page, pageSize } = this.toPagination(query);

    const where = {
      tenantId,
      role: Role.DRIVER,
      isDeleted: false,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { phone: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { licenseNo: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          licenseNo: true,
          experienceYears: true,
          operationalStatus: true,
          createdAt: true,
          drivenBuses: { select: { id: true, registrationNumber: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: rows, pagination: { total, page, pageSize } };
  }

  async createDriver(
    user: JwtPayload,
    dto: CreateDriverDto,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);

    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new BadRequestException('Phone already registered');
    }

    return this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        licenseNo: dto.licenseNo,
        experienceYears: dto.experienceYears,
        operationalStatus: dto.operationalStatus,
        role: Role.DRIVER,
        tenantId,
      },
    });
  }

  async updateDriver(
    user: JwtPayload,
    id: string,
    dto: UpdateDriverDto,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);

    const existing = await this.prisma.user.findFirst({
      where: { id, tenantId, role: Role.DRIVER, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Driver not found');

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.email !== undefined ? { email: dto.email || null } : {}),
        ...(dto.licenseNo !== undefined ? { licenseNo: dto.licenseNo } : {}),
        ...(dto.experienceYears !== undefined
          ? { experienceYears: dto.experienceYears }
          : {}),
        ...(dto.operationalStatus !== undefined
          ? { operationalStatus: dto.operationalStatus }
          : {}),
      },
    });
  }

  async deleteDriver(
    user: JwtPayload,
    id: string,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);

    const existing = await this.prisma.user.findFirst({
      where: { id, tenantId, role: Role.DRIVER, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Driver not found');

    await this.prisma.bus.updateMany({
      where: { tenantId, driverUserId: id },
      data: { driverUserId: null },
    });

    return this.prisma.user.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async listBuses(
    user: JwtPayload,
    query: AdminQueryDto,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);
    const { skip, take, page, pageSize } = this.toPagination(query);

    const where = {
      tenantId,
      isDeleted: false,
      ...(query.search
        ? {
            registrationNumber: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.bus.findMany({
        where,
        include: {
          driver: { select: { id: true, phone: true, name: true } },
          students: {
            where: { isDeleted: false },
            select: {
              id: true,
              name: true,
              parent: { select: { phone: true } },
            },
          },
        },
        orderBy: { registrationNumber: 'asc' },
        skip,
        take,
      }),
      this.prisma.bus.count({ where }),
    ]);

    return { data: rows, pagination: { total, page, pageSize } };
  }

  async createBus(
    user: JwtPayload,
    dto: CreateBusDto,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);

    if (dto.driverUserId) {
      const driver = await this.prisma.user.findFirst({
        where: {
          id: dto.driverUserId,
          tenantId,
          role: Role.DRIVER,
          isDeleted: false,
        },
      });
      if (!driver) throw new BadRequestException('Invalid driver for tenant');
    }

    return this.prisma.bus.create({
      data: {
        tenantId,
        registrationNumber: dto.registrationNumber,
        busNumber: dto.busNumber,
        vehicleNumber: dto.vehicleNumber,
        capacity: dto.capacity ?? 40,
        routeId: dto.routeId,
        driverUserId: dto.driverUserId,
      },
    });
  }

  async updateBus(
    user: JwtPayload,
    id: string,
    dto: UpdateBusDto,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);

    const existing = await this.prisma.bus.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Bus not found');

    return this.prisma.bus.update({
      where: { id },
      data: {
        ...(dto.registrationNumber !== undefined
          ? { registrationNumber: dto.registrationNumber }
          : {}),
        ...(dto.busNumber !== undefined ? { busNumber: dto.busNumber } : {}),
        ...(dto.vehicleNumber !== undefined ? { vehicleNumber: dto.vehicleNumber } : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.routeId !== undefined ? { routeId: dto.routeId || null } : {}),
        ...(dto.driverUserId !== undefined
          ? { driverUserId: dto.driverUserId || null }
          : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  async deleteBus(user: JwtPayload, id: string, tenantHeader?: string | string[]) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);

    const existing = await this.prisma.bus.findFirst({
      where: { id, tenantId, isDeleted: false },
    });
    if (!existing) throw new NotFoundException('Bus not found');

    await this.prisma.student.updateMany({
      where: { tenantId, busId: id },
      data: { busId: null },
    });

    return this.prisma.bus.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), active: false },
    });
  }

  async listBusesLive(user: JwtPayload, tenantHeader?: string | string[]) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);
    const buses = await this.prisma.bus.findMany({
      where: { tenantId, active: true, isDeleted: false },
      include: {
        driver: { select: { id: true, phone: true } },
        students: {
          where: { isDeleted: false },
          select: { id: true, name: true },
        },
      },
    });

    return Promise.all(
      buses.map(async (bus) => {
        const raw = await this.redis.client.get(
          this.redis.liveBusKey(tenantId, bus.id),
        );
        let live: Record<string, unknown> | null = null;
        if (raw) {
          try {
            live = JSON.parse(raw) as Record<string, unknown>;
          } catch {
            live = null;
          }
        }
        const activeTrip = await this.prisma.trip.findFirst({
          where: { tenantId, busId: bus.id, status: 'ACTIVE' },
        });
        return {
          bus: {
            id: bus.id,
            registrationNumber: bus.registrationNumber,
            driver: bus.driver,
            students: bus.students,
          },
          live,
          activeTrip: activeTrip
            ? { id: activeTrip.id, startedAt: activeTrip.startedAt }
            : null,
        };
      }),
    );
  }

  async applyAssignments(
    user: JwtPayload,
    dto: PostAssignmentDto,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);

    if (dto.assignStudentBus) {
      const { studentId, busId } = dto.assignStudentBus;
      const [student, bus] = await Promise.all([
        this.prisma.student.findFirst({
          where: { id: studentId, tenantId, isDeleted: false },
        }),
        this.prisma.bus.findFirst({ where: { id: busId, tenantId, isDeleted: false } }),
      ]);
      if (!student || !bus) {
        throw new BadRequestException('Invalid student or bus for tenant');
      }
      await this.prisma.student.update({
        where: { id: studentId },
        data: { busId },
      });
    }

    if (dto.assignDriverBus) {
      const { driverUserId, busId } = dto.assignDriverBus;
      const [driver, bus] = await Promise.all([
        this.prisma.user.findFirst({
          where: { id: driverUserId, tenantId, role: Role.DRIVER, isDeleted: false },
        }),
        this.prisma.bus.findFirst({ where: { id: busId, tenantId, isDeleted: false } }),
      ]);
      if (!driver || !bus) {
        throw new BadRequestException('Invalid driver or bus for tenant');
      }
      await this.prisma.bus.update({
        where: { id: busId },
        data: { driverUserId },
      });
    }

    if (dto.assignStaffBus) {
      const { staffUserId, busId } = dto.assignStaffBus;
      const [staff, bus] = await Promise.all([
        this.prisma.user.findFirst({
          where: { id: staffUserId, tenantId, role: Role.STAFF, isDeleted: false },
        }),
        this.prisma.bus.findFirst({ where: { id: busId, tenantId, isDeleted: false } }),
      ]);
      if (!staff || !bus) {
        throw new BadRequestException('Invalid staff or bus for tenant');
      }
      await this.prisma.busStaffAssignment.upsert({
        where: { busId_staffId: { busId, staffId: staffUserId } },
        update: {},
        create: { tenantId, busId, staffId: staffUserId },
      });
    }

    if (!dto.assignStudentBus && !dto.assignDriverBus && !dto.assignStaffBus) {
      throw new BadRequestException(
        'Provide assignStudentBus and/or assignDriverBus and/or assignStaffBus',
      );
    }

    return { ok: true as const };
  }

  async listStaff(user: JwtPayload, query: AdminQueryDto, tenantHeader?: string | string[]) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);
    const { skip, take, page, pageSize } = this.toPagination(query);
    const where = {
      tenantId,
      role: Role.STAFF,
      isDeleted: false,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { phone: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);
    return { data, pagination: { total, page, pageSize } };
  }

  async createStaff(user: JwtPayload, dto: CreateStaffDto, tenantHeader?: string | string[]) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);
    return this.prisma.user.create({
      data: {
        tenantId,
        role: Role.STAFF,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        licenseNo: dto.licenseNo ?? dto.roleTitle,
        experienceYears: dto.experienceYears,
      },
    });
  }

  async updateStaff(
    user: JwtPayload,
    id: string,
    dto: UpdateStaffDto,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);
    const staff = await this.prisma.user.findFirst({
      where: { id, tenantId, role: Role.STAFF, isDeleted: false },
    });
    if (!staff) throw new NotFoundException('Staff not found');
    return this.prisma.user.update({
      where: { id },
      data: { ...dto },
    });
  }

  async deleteStaff(user: JwtPayload, id: string, tenantHeader?: string | string[]) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);
    const staff = await this.prisma.user.findFirst({
      where: { id, tenantId, role: Role.STAFF, isDeleted: false },
    });
    if (!staff) throw new NotFoundException('Staff not found');
    await this.prisma.busStaffAssignment.deleteMany({ where: { tenantId, staffId: id } });
    return this.prisma.user.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  }

  async attendanceLogs(
    user: JwtPayload,
    query: AttendanceQueryDto,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where = {
      tenantId,
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.from || query.to
        ? {
            recordedAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(query.busId ? { trip: { busId: query.busId } } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.attendanceLog.findMany({
        where,
        include: {
          student: { select: { id: true, name: true } },
          trip: { select: { id: true, busId: true } },
        },
        orderBy: { recordedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.attendanceLog.count({ where }),
    ]);
    return { data, pagination: { page, pageSize, total } };
  }

  async listRoutes(user: JwtPayload, tenantHeader?: string | string[]) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);
    return this.prisma.route.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async createRoute(user: JwtPayload, dto: UpsertRouteDto, tenantHeader?: string | string[]) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);
    return this.prisma.route.create({
      data: { tenantId, name: dto.name, waypoints: dto.stops as unknown as object },
    });
  }

  async updateRoute(
    user: JwtPayload,
    id: string,
    dto: UpsertRouteDto,
    tenantHeader?: string | string[],
  ) {
    this.ensureAdmin(user);
    const tenantId = this.tenant(user, tenantHeader);
    const route = await this.prisma.route.findFirst({ where: { id, tenantId } });
    if (!route) throw new NotFoundException('Route not found');
    return this.prisma.route.update({
      where: { id },
      data: { name: dto.name, waypoints: dto.stops as unknown as object },
    });
  }
}
