import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateBusDto {
  @IsString()
  registrationNumber!: string;

  @IsOptional()
  @IsString()
  busNumber?: string;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsString()
  driverUserId?: string;
}
