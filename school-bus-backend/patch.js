const fs = require('fs');
const file = '/home/mitron/Documents/allklbtechprojects/school_bus_tracking/school-bus-backend/src/driver/driver.service.ts';
let content = fs.readFileSync(file, 'utf8');

const newMethod = `
  async getDriverContext(user: JwtPayload) {
    if (!user.tenantId) throw new ForbiddenException('Driver must belong to a tenant');
    
    // Get stats for today (from midnight)
    const today = new Date();
    today.setHours(0,0,0,0);

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
`;

content = content.replace('async startTrip(', newMethod + '\n  async startTrip(');
fs.writeFileSync(file, content);
console.log('patched service');
