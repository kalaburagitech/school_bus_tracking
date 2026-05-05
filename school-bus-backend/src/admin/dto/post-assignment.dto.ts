import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class StudentBusAssignment {
  @IsString()
  studentId!: string;

  @IsString()
  busId!: string;
}

class DriverBusAssignment {
  @IsString()
  driverUserId!: string;

  @IsString()
  busId!: string;
}

class StaffBusAssignment {
  @IsString()
  staffUserId!: string;

  @IsString()
  busId!: string;
}

export class PostAssignmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => StudentBusAssignment)
  assignStudentBus?: StudentBusAssignment;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => DriverBusAssignment)
  assignDriverBus?: DriverBusAssignment;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => StaffBusAssignment)
  assignStaffBus?: StaffBusAssignment;
}
