import { plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  @IsOptional()
  KAFKA_BROKERS?: string;

  @IsString()
  @IsOptional()
  KAFKA_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  KAFKA_GROUP_ID?: string;

  @IsString()
  @IsOptional()
  KAFKA_TRACKING_TOPIC?: string;

  @IsString()
  @IsOptional()
  KAFKA_DISABLED?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32, {
    message: 'JWT_ACCESS_SECRET must be at least 32 characters',
  })
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32, {
    message: 'JWT_REFRESH_SECRET must be at least 32 characters',
  })
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_SEC?: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_SEC?: string;

  @IsNumber()
  @IsOptional()
  PORT?: number;

  @IsString()
  @IsOptional()
  NODE_ENV?: string;

  @IsString()
  @IsOptional()
  OTP_TTL_SECONDS?: string;

  @IsString()
  @IsOptional()
  OTP_DEV_CODE?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });
  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Env validation failed: ${messages}`);
  }
  return validated;
}
