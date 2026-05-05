import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @MinLength(10)
  @Matches(/^\+?[0-9]{10,15}$/, {
    message: 'phone must be E.164-like digits (10–15)',
  })
  phone!: string;
}
