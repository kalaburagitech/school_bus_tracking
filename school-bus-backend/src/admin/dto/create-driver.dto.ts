import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateDriverDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/)
  phone!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  licenseNo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  operationalStatus?: 'ACTIVE' | 'INACTIVE';
}
