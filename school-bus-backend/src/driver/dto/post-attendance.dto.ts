import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum AttendanceActionDto {
  PICKUP = 'PICKUP',
  DROPOFF = 'DROPOFF',
}

export class PostAttendanceDto {
  @ApiProperty()
  @IsString()
  tripId!: string;

  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiProperty({ enum: AttendanceActionDto })
  @IsEnum(AttendanceActionDto)
  type!: AttendanceActionDto;
}
