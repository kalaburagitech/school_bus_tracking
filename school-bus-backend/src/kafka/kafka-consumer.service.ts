import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, EachMessagePayload, Kafka } from 'kafkajs';
import { TrackingIngestService } from '../tracking/tracking-ingest.service';
import {
  TRACKING_EVENT_TYPES,
  type TrackingEvent,
} from './tracking-event.types';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private consumer: Consumer | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly trackingIngest: TrackingIngestService,
  ) {}

  get disabled(): boolean {
    return this.config.get<boolean>('kafka.disabled', false);
  }

  async onModuleInit() {
    if (this.disabled) {
      this.logger.warn('Kafka consumer disabled (KAFKA_DISABLED)');
      return;
    }
    const brokers = this.config.get<string[]>('kafka.brokers', [
      'localhost:9092',
    ]);
    const kafka = new Kafka({
      clientId: `${this.config.get<string>('kafka.clientId', 'school-bus-backend')}-consumer`,
      brokers,
    });
    this.consumer = kafka.consumer({
      groupId: this.config.get<string>(
        'kafka.groupId',
        'school-bus-tracking-consumer',
      ),
    });
    const topic = this.config.get<string>(
      'kafka.trackingTopic',
      'tracking.events',
    );
    this.logger.log(
      `kafka_consumer_preflight mode=enabled brokers=${brokers.join(',')} topic=${topic}`,
    );
    try {
      await this.consumer.connect();
      await this.consumer.subscribe({ topic, fromBeginning: false });
      await this.consumer.run({
        eachMessage: (payload) => this.handleMessage(payload),
      });
      this.logger.log(`Kafka consumer subscribed to ${topic}`);
    } catch (e) {
      this.logger.error(
        `Kafka consumer failed: ${(e as Error).message}. Set KAFKA_DISABLED=1 for local dev without Kafka.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.consumer) {
      await this.consumer.disconnect().catch(() => undefined);
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const raw = payload.message.value?.toString();
    if (!raw) return;
    let event: TrackingEvent;
    try {
      event = JSON.parse(raw) as TrackingEvent;
    } catch {
      this.logger.warn('Invalid JSON tracking event');
      return;
    }
    try {
      if (event.type === TRACKING_EVENT_TYPES.LOCATION_UPDATE) {
        await this.trackingIngest.processLocationUpdate(event);
      } else if (event.type === TRACKING_EVENT_TYPES.ATTENDANCE) {
        await this.trackingIngest.processAttendanceEvent(event);
      }
    } catch (e) {
      this.logger.error(`Tracking handler error: ${(e as Error).message}`);
    }
  }
}
