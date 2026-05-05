import 'dotenv/config';
import { PrismaClient, Role, TripStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-school' },
    create: { name: 'Demo School', slug: 'demo-school' },
    update: { name: 'Demo School' },
  });

  const superAdminPhone = '9880020224';
  const existingSuperAdmin = await prisma.user.findUnique({
    where: { phone: superAdminPhone },
  });
  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        phone: superAdminPhone,
        role: Role.SUPER_ADMIN,
        tenantId: null,
        passwordHash: await bcrypt.hash('123456', 12),
      },
    });
  }

  const schoolAdmin = await prisma.user.upsert({
    where: { phone: '+10000000002' },
    create: {
      phone: '+10000000002',
      role: Role.SCHOOL_ADMIN,
      tenantId: tenant.id,
    },
    update: { tenantId: tenant.id },
  });

  const driver = await prisma.user.upsert({
    where: { phone: '+10000000003' },
    create: {
      phone: '+10000000003',
      role: Role.DRIVER,
      tenantId: tenant.id,
    },
    update: { tenantId: tenant.id },
  });

  const parent = await prisma.user.upsert({
    where: { phone: '+10000000004' },
    create: {
      phone: '+10000000004',
      role: Role.PARENT,
      tenantId: tenant.id,
    },
    update: { tenantId: tenant.id },
  });

  let route = await prisma.route.findFirst({
    where: { tenantId: tenant.id, name: 'Morning route' },
  });
  if (!route) {
    route = await prisma.route.create({
      data: {
        tenantId: tenant.id,
        name: 'Morning route',
        waypoints: [],
      },
    });
  }

  let bus = await prisma.bus.findFirst({
    where: {
      tenantId: tenant.id,
      registrationNumber: 'KA-01-AB-1234',
    },
  });
  if (!bus) {
    bus = await prisma.bus.create({
      data: {
        tenantId: tenant.id,
        registrationNumber: 'KA-01-AB-1234',
        capacity: 40,
        driverUserId: driver.id,
        routeId: route.id,
        active: true,
      },
    });
  } else {
    bus = await prisma.bus.update({
      where: { id: bus.id },
      data: {
        driverUserId: driver.id,
        routeId: route.id,
        active: true,
      },
    });
  }

  let student = await prisma.student.findFirst({
    where: { tenantId: tenant.id, name: 'Demo Student' },
  });
  if (!student) {
    student = await prisma.student.create({
      data: {
        tenantId: tenant.id,
        name: 'Demo Student',
        busId: bus.id,
        parentUserId: parent.id,
      },
    });
  } else {
    student = await prisma.student.update({
      where: { id: student.id },
      data: {
        busId: bus.id,
        parentUserId: parent.id,
      },
    });
  }

  await prisma.trip.deleteMany({
    where: { tenantId: tenant.id, busId: bus.id, status: TripStatus.ACTIVE },
  });

  // eslint-disable-next-line no-console
  console.log('Seed OK:', {
    tenantId: tenant.id,
    schoolAdmin: schoolAdmin.id,
    driver: driver.id,
    parent: parent.id,
    busId: bus.id,
    studentId: student.id,
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
