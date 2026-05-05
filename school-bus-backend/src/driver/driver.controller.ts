import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { JwtPayload } from '../common/types/jwt-payload.types';
import { DriverService } from './driver.service';
import { PostAttendanceDto } from './dto/post-attendance.dto';
import { PostLocationDto } from './dto/post-location.dto';
import { StartTripDto } from './dto/start-trip.dto';
import { EndTripDto } from './dto/end-trip.dto';

@ApiTags('driver')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DRIVER)
@Controller('driver')
export class DriverController {
  constructor(private readonly driver: DriverService) { }

  @Get('me')
  @ApiOperation({ summary: 'Get current driver context and assigned bus details' })
  getDriverContext(@CurrentUser() user: JwtPayload) {
    return this.driver.getDriverContext(user);
  }

  @Post('trips/start')
  @ApiOperation({ summary: 'Start or resume an active trip for assigned bus' })
  startTrip(@CurrentUser() user: JwtPayload, @Body() dto: StartTripDto) {
    return this.driver.startTrip(user, dto.busId);
  }

  @Post('trips/location')
  @ApiOperation({ summary: 'Publish GPS sample (Kafka or inline if disabled)' })
  postLocation(@CurrentUser() user: JwtPayload, @Body() dto: PostLocationDto) {
    return this.driver.postLocation(user, dto);
  }

  @Post('trips/attendance')
  @ApiOperation({ summary: 'Mark student pickup or drop on active trip' })
  postAttendance(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PostAttendanceDto,
  ) {
    return this.driver.postAttendance(user, dto);
  }

  @Post('trips/end')
  @ApiOperation({ summary: 'End the active trip' })
  endTrip(@CurrentUser() user: JwtPayload, @Body() dto: EndTripDto) {
    return this.driver.endTrip(user, dto);
  }
}
