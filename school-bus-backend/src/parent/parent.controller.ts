import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { JwtPayload } from '../common/types/jwt-payload.types';
import { ParentService } from './parent.service';

@ApiTags('parent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARENT)
@Controller('parent')
export class ParentController {
  constructor(private readonly parent: ParentService) { }

  @Get('me')
  @ApiOperation({ summary: 'Get parent context: linked students and their buses' })
  me(@CurrentUser() user: JwtPayload) {
    return this.parent.getMyContext(user);
  }

  @Get('bus/live')
  @ApiOperation({ summary: 'Live state for buses assigned to children' })
  busLive(@CurrentUser() user: JwtPayload) {
    return this.parent.getBusLive(user);
  }

  @Get('history')
  @ApiOperation({ summary: 'Attendance history for date range' })
  history(
    @CurrentUser() user: JwtPayload,
    @Query('from') fromIso: string,
    @Query('to') toIso: string,
    @Query('granularity') granularity?: 'daily' | 'monthly',
  ) {
    const from = new Date(fromIso);
    const to = new Date(toIso);
    return this.parent.getHistory(
      user,
      from,
      to,
      granularity === 'monthly' ? 'monthly' : 'daily',
    );
  }
}
