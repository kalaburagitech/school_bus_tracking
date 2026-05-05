import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('redisUrl', 'redis://localhost:6379');
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    this.client.on('error', (err) =>
      this.logger.error(`Redis error: ${err.message}`),
    );
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  liveBusKey(tenantId: string, busId: string): string {
    return `bus:live:${tenantId}:${busId}`;
  }

  busTrailKey(tenantId: string, busId: string): string {
    return `bus:trail:${tenantId}:${busId}`;
  }

  otpKey(phone: string): string {
    return `otp:${phone}`;
  }
}
