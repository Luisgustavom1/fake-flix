import { DomainEvent } from '../../../../shared/core/event/domain-event.interface';
import { randomUUID } from 'crypto';

/**
 * Domain Event: Subscription Activated
 *
 * Published when a subscription is activated.
 *
 * Consumers of this event might:
 * - Grant user access to content
 * - Update user profile with subscription status
 * - Send welcome/activation email
 * - Trigger analytics tracking
 * - Update recommendation engines
 *
 * @example
 * ```typescript
 * const event = new SubscriptionActivatedEvent('sub-123', 'user-456');
 * ```
 */
export class SubscriptionActivatedEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType = 'SubscriptionActivated';
  readonly eventVersion = 1;

  constructor(
    readonly aggregateId: string, // subscriptionId
    readonly userId: string,
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
    };
  }

  /**
   * Human-readable description
   */
  toString(): string {
    return `[${this.eventType}] Subscription ${this.aggregateId} activated for user ${this.userId}`;
  }
}
