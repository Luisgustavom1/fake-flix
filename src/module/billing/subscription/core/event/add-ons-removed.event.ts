import { DomainEvent } from '../../../../shared/core/event/domain-event.interface';
import { randomUUID } from 'crypto';

/**
 * Domain Event: Add-Ons Removed
 *
 * Published when add-ons are removed from a subscription.
 * This typically happens during plan changes when add-ons are incompatible
 * with the new plan.
 *
 * Consumers of this event might:
 * - Send notifications about feature loss
 * - Update billing projections
 * - Trigger refund processes
 * - Log for audit trails
 *
 * @example
 * ```typescript
 * const event = new AddOnsRemovedEvent(
 *   'sub-123',
 *   ['addon-1', 'addon-2'],
 *   'Incompatible with new plan',
 * );
 * ```
 */
export class AddOnsRemovedEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType = 'AddOnsRemoved';
  readonly eventVersion = 1;

  constructor(
    readonly aggregateId: string, // subscriptionId
    readonly removedAddOnIds: string[],
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
      payload: {
        removedAddOnIds: this.removedAddOnIds,
        reason: this.reason,
      },
    };
  }
}
