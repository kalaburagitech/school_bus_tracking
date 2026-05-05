import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { JwtPayload } from '../common/types/jwt-payload.types';
import { AdminService } from './admin.service';
import { AdminQueryDto } from './dto/admin-query.dto';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { CreateBusDto } from './dto/create-bus.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { PostAssignmentDto } from './dto/post-assignment.dto';
import { UpsertRouteDto } from './dto/upsert-route.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@ApiTags('admin')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: false })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SCHOOL_ADMIN, Role.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard/summary')
  @ApiOperation({ summary: 'KPI summary and recent activity list' })
  dashboardSummary(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.dashboardSummary(user, tenantHeader);
  }

  @Get('students')
  @ApiOperation({ summary: 'List students in tenant with search/pagination' })
  students(
    @CurrentUser() user: JwtPayload,
    @Query() query: AdminQueryDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.listStudents(user, query, tenantHeader);
  }

  @Post('students')
  createStudent(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateStudentDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.createStudent(user, dto, tenantHeader);
  }

  @Patch('students/:id')
  updateStudent(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.updateStudent(user, id, dto, tenantHeader);
  }

  @Delete('students/:id')
  deleteStudent(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.deleteStudent(user, id, tenantHeader);
  }

  @Get('drivers')
  drivers(
    @CurrentUser() user: JwtPayload,
    @Query() query: AdminQueryDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.listDrivers(user, query, tenantHeader);
  }

  @Post('drivers')
  createDriver(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDriverDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.createDriver(user, dto, tenantHeader);
  }

  @Patch('drivers/:id')
  updateDriver(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.updateDriver(user, id, dto, tenantHeader);
  }

  @Delete('drivers/:id')
  deleteDriver(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.deleteDriver(user, id, tenantHeader);
  }

  @Get('staff')
  staff(
    @CurrentUser() user: JwtPayload,
    @Query() query: AdminQueryDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.listStaff(user, query, tenantHeader);
  }

  @Post('staff')
  createStaff(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateStaffDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.createStaff(user, dto, tenantHeader);
  }

  @Patch('staff/:id')
  updateStaff(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.updateStaff(user, id, dto, tenantHeader);
  }

  @Delete('staff/:id')
  deleteStaff(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.deleteStaff(user, id, tenantHeader);
  }

  @Get('buses')
  buses(
    @CurrentUser() user: JwtPayload,
    @Query() query: AdminQueryDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.listBuses(user, query, tenantHeader);
  }

  @Post('buses')
  createBus(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBusDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.createBus(user, dto, tenantHeader);
  }

  @Patch('buses/:id')
  updateBus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBusDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.updateBus(user, id, dto, tenantHeader);
  }

  @Delete('buses/:id')
  deleteBus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.deleteBus(user, id, tenantHeader);
  }

  @Get('buses/live')
  @ApiOperation({ summary: 'All buses with Redis live snapshot + active trip' })
  busesLive(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.listBusesLive(user, tenantHeader);
  }

  @Post('assignments')
  @ApiOperation({ summary: 'Assign student→bus and/or driver→bus' })
  assignments(
    @CurrentUser() user: JwtPayload,
    @Headers('x-tenant-id') tenantHeader: string | undefined,
    @Body() dto: PostAssignmentDto,
  ) {
    return this.admin.applyAssignments(user, dto, tenantHeader);
  }

  @Get('attendance-logs')
  attendanceLogs(
    @CurrentUser() user: JwtPayload,
    @Query() query: AttendanceQueryDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.attendanceLogs(user, query, tenantHeader);
  }

  @Get('routes')
  routes(@CurrentUser() user: JwtPayload, @Headers('x-tenant-id') tenantHeader?: string) {
    return this.admin.listRoutes(user, tenantHeader);
  }

  @Post('routes')
  createRoute(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertRouteDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.createRoute(user, dto, tenantHeader);
  }

  @Patch('routes/:id')
  updateRoute(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpsertRouteDto,
    @Headers('x-tenant-id') tenantHeader?: string,
  ) {
    return this.admin.updateRoute(user, id, dto, tenantHeader);
  }
}
