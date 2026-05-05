import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RedisModule } from '../redis/redis.module';
import { TrackingIngestService } from './tracking-ingest.service';

@Module({
  imports: [PrismaModule, RedisModule, forwardRef(() => RealtimeModule)],
  providers: [TrackingIngestService],
  exports: [TrackingIngestService],
})
export class TrackingModule {}
