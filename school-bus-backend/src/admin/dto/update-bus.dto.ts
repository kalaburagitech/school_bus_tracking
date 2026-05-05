import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateBusDto {
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  busNumber?: string | null;

  @IsOptional()
  @IsString()
  vehicleNumber?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  routeId?: string | null;

  @IsOptional()
  @IsString()
  driverUserId?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
