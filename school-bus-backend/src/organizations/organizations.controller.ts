import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { JwtPayload } from '../common/types/jwt-payload.types';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationQueryDto } from './dto/organization-query.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'List organizations with search/filter pagination' })
  list(@Query() query: OrganizationQueryDto, @CurrentUser() _user: JwtPayload) {
    return this.organizations.list(query);
  }

  @Get('switcher')
  @ApiOperation({ summary: 'Tenant options for super admin dropdown' })
  switcher(@CurrentUser() _user: JwtPayload) {
    return this.organizations.listForSwitcher();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Organization details + analytics' })
  details(@Param('id') id: string, @CurrentUser() _user: JwtPayload) {
    return this.organizations.details(id);
  }

  @Post()
  create(@Body() dto: CreateOrganizationDto, @CurrentUser() _user: JwtPayload) {
    return this.organizations.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() _user: JwtPayload,
  ) {
    return this.organizations.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() _user: JwtPayload) {
    return this.organizations.remove(id);
  }
}
