import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class EndTripDto {
  @ApiProperty({ description: 'Trip ID to end' })
  @IsString()
  tripId!: string;
}
