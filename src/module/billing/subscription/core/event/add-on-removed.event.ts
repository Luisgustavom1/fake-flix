import { DomainEvent } from '../../../../shared/core/event/domain-event.interface';
import { randomUUID } from 'crypto';

/**
 * Domain Event: Add-On Removed from Subscription
 *
 * Published when an add-on is removed from a subscription.
 *
 * Consumers of this event might:
 * - Revoke additional features/content access
 * - Send confirmation email
 * - Update analytics
 * - Process refund/credit
 * - Update recommendation engines
 *
 * @example
 * ```typescript
 * const event = new AddOnRemovedEvent('sub-123', 'addon-premium-channels');
 * ```
 */
export class AddOnRemovedEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType = 'AddOnRemoved';
  readonly eventVersion = 1;

  constructor(
    readonly aggregateId: string, // subscriptionId
    readonly addOnId: string,
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
    };
  }

  /**
   * Human-readable description
   */
  toString(): string {
    return `[${this.eventType}] Add-on ${this.addOnId} removed from subscription ${this.aggregateId}`;
  }
}
