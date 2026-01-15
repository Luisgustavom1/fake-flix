import { DomainEvent } from './domain-event.interface';

/**
 * Event Bus interface for publishing domain events
 *
 * Implementations might:
 * - Log events (SimpleEventBus)
 * - Publish to message broker (Kafka, RabbitMQ)
 * - Store in event store
 * - Dispatch to in-process handlers
 *
 * @example
 * ```typescript
 * constructor(
 *   @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
 * ) {}
 *
 * async someMethod() {
 *   const event = new SubscriptionPlanChangedEvent(...);
 *   await this.eventBus.publish(event);
 * }
 * ```
 */
export interface IEventBus {
  /**
   * Publish single event
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple events
   */
  publishAll(events: DomainEvent[]): Promise<void>;
}

/**
 * DI token for Event Bus
 *
 * Usage in constructor:
 * @Inject(EVENT_BUS) private readonly eventBus: IEventBus
 */
export const EVENT_BUS = Symbol('EVENT_BUS');
