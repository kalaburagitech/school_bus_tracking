import { Module } from '@nestjs/common';
import { KafkaModule } from '../kafka/kafka.module';
import { TrackingModule } from '../tracking/tracking.module';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';

@Module({
  imports: [KafkaModule, TrackingModule],
  controllers: [DriverController],
  providers: [DriverService],
})
export class DriverModule {}
