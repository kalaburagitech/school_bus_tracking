import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @MinLength(10)
  @Matches(/^\+?[0-9]{10,15}$/)
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(4, 8)
  code!: string;

  /** When logging in as SUPER_ADMIN, pass tenant to scope JWT (WS + APIs). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  impersonateTenantId?: string;
}
