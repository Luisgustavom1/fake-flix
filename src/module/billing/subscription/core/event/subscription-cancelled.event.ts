import { DomainEvent } from '../../../../shared/core/event/domain-event.interface';
import { randomUUID } from 'crypto';

/**
 * Domain Event: Subscription Cancelled
 *
 * Published when a subscription is cancelled by the user or system.
 *
 * Consumers of this event might:
 * - Revoke user access to content (immediately or at period end)
 * - Send cancellation confirmation email
 * - Trigger win-back campaigns
 * - Update analytics dashboards
 * - Notify billing systems to stop recurring charges
 *
 * @example
 * ```typescript
 * const event = new SubscriptionCancelledEvent(
 *   'sub-123',
 *   'user-456',
 *   'User requested cancellation',
 * );
 * ```
 */
export class SubscriptionCancelledEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType = 'SubscriptionCancelled';
  readonly eventVersion = 1;

  constructor(
    readonly aggregateId: string, // subscriptionId
    readonly userId: string,
    readonly reason: string,
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
      userId: this.userId,
      reason: this.reason,
    };
  }

  /**
   * Human-readable description
   */
  toString(): string {
    return `[${this.eventType}] Subscription ${this.aggregateId} cancelled for user ${this.userId}. Reason: ${this.reason}`;
  }
}
