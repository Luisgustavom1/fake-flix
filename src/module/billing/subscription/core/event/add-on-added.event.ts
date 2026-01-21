import { DomainEvent } from '../../../../shared/core/event/domain-event.interface';
import { randomUUID } from 'crypto';

/**
 * Domain Event: Add-On Added to Subscription
 *
 * Published when an add-on is successfully added to a subscription.
 *
 * Consumers of this event might:
 * - Grant additional features/content access
 * - Send confirmation email
 * - Update analytics
 * - Trigger prorated billing
 * - Update recommendation engines
 *
 * @example
 * ```typescript
 * const event = new AddOnAddedEvent('sub-123', 'addon-premium-channels', 2);
 * ```
 */
export class AddOnAddedEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType = 'AddOnAdded';
  readonly eventVersion = 1;

  constructor(
    readonly aggregateId: string, // subscriptionId
    readonly addOnId: string,
    readonly quantity: number,
  ) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
  }

  /**
   * Serialize to JSON for message broker
   */
  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      addOnId: this.addOnId,
      quantity: this.quantity,
    };
  }

  /**
   * Human-readable description
   */
  toString(): string {
    return `[${this.eventType}] Add-on ${this.addOnId} (quantity: ${this.quantity}) added to subscription ${this.aggregateId}`;
  }
}
