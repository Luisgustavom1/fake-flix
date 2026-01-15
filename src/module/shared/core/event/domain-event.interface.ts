/**
 * Base interface for all domain events
 *
 * Domain events represent something that happened in the domain that domain
 * experts care about. They are named in past tense (e.g., SubscriptionPlanChanged).
 *
 * @example
 * ```typescript
 * export class SubscriptionPlanChangedEvent implements DomainEvent {
 *   readonly eventId: string;
 *   readonly occurredOn: Date;
 *   readonly eventType = 'SubscriptionPlanChanged';
 *
 *   constructor(
 *     readonly aggregateId: string,
 *     readonly userId: string,
 *     readonly oldPlanId: string,
 *     readonly newPlanId: string,
 *   ) {
 *     this.eventId = randomUUID();
 *     this.occurredOn = new Date();
 *   }
 * }
 * ```
 */
export interface DomainEvent {
  /**
   * Unique event identifier
   */
  readonly eventId: string;

  /**
   * When the event occurred
   */
  readonly occurredOn: Date;

  /**
   * ID of the aggregate that generated the event
   */
  readonly aggregateId: string;

  /**
   * Type of event (for routing/filtering)
   * Should match the class name (e.g., 'SubscriptionPlanChanged')
   */
  readonly eventType: string;

  /**
   * Optional event version (for schema evolution)
   */
  readonly eventVersion?: number;
}
