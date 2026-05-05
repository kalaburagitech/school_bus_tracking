import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RealtimeModule } from './realtime/realtime.module';
import { TrackingModule } from './tracking/tracking.module';
import { KafkaModule } from './kafka/kafka.module';
import { AuthModule } from './auth/auth.module';
import { DriverModule } from './driver/driver.module';
import { ParentModule } from './parent/parent.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { StartupSeedService } from './bootstrap/startup-seed.service';
import { OrganizationsModule } from './organizations/organizations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 200,
      },
    ]),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('jwt.accessSecret'),
        signOptions: {
          expiresIn: config.get<number>('jwt.accessExpiresSec', 900),
        },
      }),
    }),
    PrismaModule,
    RedisModule,
    RealtimeModule,
    TrackingModule,
    KafkaModule,
    AuthModule,
    DriverModule,
    ParentModule,
    AdminModule,
    OrganizationsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    StartupSeedService,
  ],
})
export class AppModule {}
