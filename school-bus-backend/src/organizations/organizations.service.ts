import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationQueryDto } from './dto/organization-query.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: OrganizationQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where = {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { code: { contains: query.search, mode: 'insensitive' as const } },
              { slug: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        orderBy: { [query.sortBy ?? 'createdAt']: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { data, pagination: { page, pageSize, total } };
  }

  async listForSwitcher() {
    return this.prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, slug: true, code: true },
      orderBy: { name: 'asc' },
    });
  }

  async details(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Organization not found');

    const [students, buses, drivers, activeTrips, attendanceToday] = await Promise.all([
      this.prisma.student.count({ where: { tenantId: id, isDeleted: false } }),
      this.prisma.bus.count({ where: { tenantId: id, isDeleted: false } }),
      this.prisma.user.count({
        where: { tenantId: id, role: Role.DRIVER, isDeleted: false },
      }),
      this.prisma.trip.count({ where: { tenantId: id, status: 'ACTIVE' } }),
      this.prisma.attendanceLog.count({
        where: {
          tenantId: id,
          recordedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return {
      tenant,
      analytics: { students, buses, drivers, activeTrips, attendanceToday },
    };
  }

  async create(dto: CreateOrganizationDto) {
    const phoneUser = await this.prisma.user.findUnique({ where: { phone: dto.adminPhone } });
    if (phoneUser) throw new BadRequestException('Admin phone already exists');

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          code: dto.code,
          contactPerson: dto.contactPerson,
          phone: dto.phone,
          email: dto.email,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          status: dto.status ?? 'ACTIVE',
        },
      });

      const schoolAdmin = await tx.user.create({
        data: {
          phone: dto.adminPhone,
          email: dto.adminEmail,
          name: dto.adminName,
          role: Role.SCHOOL_ADMIN,
          tenantId: tenant.id,
        },
      });

      return { tenant, schoolAdmin };
    });
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Organization not found');

    return this.prisma.tenant.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.tenant.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Organization not found');
    return this.prisma.tenant.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }
}
