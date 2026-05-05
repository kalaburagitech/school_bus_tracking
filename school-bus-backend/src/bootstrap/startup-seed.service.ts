import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StartupSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    const tenant = await this.prisma.tenant.upsert({
      where: { slug: 'demo-school' },
      create: { name: 'Demo School', slug: 'demo-school' },
      update: { name: 'Demo School' },
    });

    const phone = '9880020224';
    const existing = await this.prisma.user.findUnique({ where: { phone } });

    if (!existing) {
      await this.prisma.user.create({
        data: {
          phone,
          role: Role.SUPER_ADMIN,
          tenantId: null,
          passwordHash: await bcrypt.hash('123456', 12),
        },
      });
      this.logger.log('startup_seed created default super admin + tenant');
      return;
    }

    if (!existing.passwordHash) {
      await this.prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash: await bcrypt.hash('123456', 12) },
      });
      this.logger.log('startup_seed updated super admin password hash');
    }

    this.logger.log(`startup_seed verified demo tenant=${tenant.id} superAdmin=${phone}`);
  }
}
