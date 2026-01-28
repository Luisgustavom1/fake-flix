import { DomainEvent } from '../../../../shared/core/event/domain-event.interface';
import { randomUUID } from 'crypto';

/**
 * Domain Event: Subscription Plan Changed
 *
 * Published when a subscription successfully changes to a new plan.
 *
 * Consumers of this event might:
 * - Update analytics dashboards
 * - Send notification emails
 * - Update recommendation engines
 * - Trigger external integrations
 *
 * @example
 * ```typescript
 * const event = new SubscriptionPlanChangedEvent(
 *   'sub-123',
 *   'user-456',
 *   'plan-basic',
 *   'plan-premium',
 *   10.50,
 *   25.00,
 *   2,
 *   new Date(),
 * );
 * ```
 */
export class SubscriptionPlanChangedEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType = 'SubscriptionPlanChanged';
  readonly eventVersion = 1;

  constructor(
    readonly aggregateId: string, // subscriptionId
    readonly userId: string,
    readonly oldPlanId: string,
    readonly newPlanId: string,
    readonly prorationCredit: number,
    readonly prorationCharge: number,
    readonly addOnsRemoved: number,
    readonly effectiveDate: Date,
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
        userId: this.userId,
        oldPlanId: this.oldPlanId,
        newPlanId: this.newPlanId,
        prorationCredit: this.prorationCredit,
        prorationCharge: this.prorationCharge,
        addOnsRemoved: this.addOnsRemoved,
        effectiveDate: this.effectiveDate.toISOString(),
      },
    };
  }
}
