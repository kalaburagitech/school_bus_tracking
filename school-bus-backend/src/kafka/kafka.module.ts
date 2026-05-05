import { Module } from '@nestjs/common';
import { TrackingModule } from '../tracking/tracking.module';
import { KafkaConsumerService } from './kafka-consumer.service';
import { KafkaProducerService } from './kafka-producer.service';

@Module({
  imports: [TrackingModule],
  providers: [KafkaProducerService, KafkaConsumerService],
  exports: [KafkaProducerService],
})
export class KafkaModule {}
