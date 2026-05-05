import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class StartTripDto {
  @ApiPropertyOptional({
    description: 'If driver has multiple buses, pass bus id',
  })
  @IsOptional()
  @IsString()
  busId?: string;
}
