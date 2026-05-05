import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import type { TrackingEvent } from './tracking-event.types';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private producer: Producer | null = null;
  private kafka: Kafka | null = null;
  private connectFailed = false;

  constructor(private readonly config: ConfigService) {}

  get disabled(): boolean {
    return this.config.get<boolean>('kafka.disabled', false);
  }

  private get topic(): string {
    return this.config.get<string>('kafka.trackingTopic', 'tracking.events');
  }

  async onModuleInit() {
    if (this.disabled) {
      this.logger.warn('Kafka producer disabled (KAFKA_DISABLED)');
      return;
    }
    const brokers = this.config.get<string[]>('kafka.brokers', [
      'localhost:9092',
    ]);
    this.logger.log(
      `kafka_preflight mode=enabled brokers=${brokers.join(',')} topic=${this.topic}`,
    );
    this.kafka = new Kafka({
      clientId: this.config.get<string>('kafka.clientId', 'school-bus-backend'),
      brokers,
    });
    this.producer = this.kafka.producer();
    try {
      await this.producer.connect();
      this.logger.log(`Kafka producer connected to ${brokers.join(', ')}`);
    } catch (e) {
      this.connectFailed = true;
      this.producer = null;
      this.logger.error(
        `Kafka producer failed to connect: ${(e as Error).message}. Continuing without Kafka producer; set KAFKA_DISABLED=1 for local dev.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.producer) {
      await this.producer.disconnect().catch(() => undefined);
    }
  }

  async publishTrackingEvent(event: TrackingEvent): Promise<void> {
    if (this.disabled || !this.producer) {
      if (this.connectFailed) {
        this.logger.debug(
          `Kafka producer unavailable; dropping event type=${event.type}`,
        );
      }
      return;
    }
    await this.producer.send({
      topic: this.topic,
      messages: [
        {
          key: `${event.tenantId}:${event.busId}`,
          value: JSON.stringify(event),
        },
      ],
    });
  }
}
