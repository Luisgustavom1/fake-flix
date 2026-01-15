import { Injectable } from '@nestjs/common';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';
import { IEventBus } from '../../../core/event/event-bus.interface';
import { DomainEvent } from '../../../core/event/domain-event.interface';

/**
 * SIMPLE EVENT BUS
 *
 * Basic implementation that logs events using AppLogger.
 * This is sufficient for Phase 4 - provides observability without complexity.
 *
 * Future: Replace with message broker integration (Kafka/RabbitMQ)
 *
 * @example Logs output:
 * ```json
 * {
 *   "level": "info",
 *   "message": "Domain Event Published",
 *   "eventId": "a1b2c3d4-...",
 *   "eventType": "SubscriptionPlanChanged",
 *   "aggregateId": "sub-123",
 *   "occurredOn": "2026-01-15T10:30:00.000Z",
 *   "payload": { "userId": "user-456", ... }
 * }
 * ```
 */
@Injectable()
export class SimpleEventBus implements IEventBus {
  constructor(private readonly logger: AppLogger) {}

  /**
   * Publish single domain event
   * Currently logs the event - future implementations will publish to message broker
   */
  async publish(event: DomainEvent): Promise<void> {
    this.logger.log('Domain Event Published', {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      occurredOn: event.occurredOn,
      payload: (event as any).toJSON?.() || event,
    });

    // TODO: In future, publish to message broker
    // await this.messageBroker.publish(event);
  }

  /**
   * Publish multiple domain events
   * Publishes sequentially to maintain order
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }

    this.logger.log('Published batch of domain events', {
      count: events.length,
      types: events.map((e) => e.eventType),
    });
  }
}
