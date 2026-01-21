/**
 * SUBSCRIPTION DOMAIN MODEL
 *
 * Rich domain entity that encapsulates subscription business logic.
 * This is separate from ORM Entity (subscription.entity.ts) to maintain
 * clear separation between domain and infrastructure concerns.
 *
 * Key Principles:
 * - IDs are simple strings (no Value Objects - pragmatic approach)
 * - Behavior is encapsulated (changePlan, activate, cancel, etc.)
 * - Invariants are protected (validation in methods)
 * - State changes are intentional (no direct setters)
 * - Required fields throw errors if null (fail-fast approach)
 */

import { SubscriptionStatus } from '@billingModule/subscription/core/enum/subscription-status.enum';
import { SubscriptionAddOn } from '@billingModule/subscription/persistence/entity/subscription-add-on.entity';
import { SubscriptionDiscount } from '@billingModule/subscription/persistence/entity/subscription-discount.entity';
import { BillingAddress } from '@billingModule/shared/core/interface/common.interface';
import {
  SubscriptionProps,
  ProrationResult,
  AddOnMigrationResult,
  PlanChangeResult,
  JsonMetadata,
  DomainError,
} from './subscription.types';
import { DomainEvent } from '../../../../shared/core/event/domain-event.interface';
import { SubscriptionPlanChangedEvent } from '../event/subscription-plan-changed.event';
import { AddOnsRemovedEvent } from '../event/add-ons-removed.event';
import { SubscriptionActivatedEvent } from '../event/subscription-activated.event';
import { SubscriptionCancelledEvent } from '../event/subscription-cancelled.event';
import { AddOnAddedEvent } from '../event/add-on-added.event';
import { AddOnRemovedEvent } from '../event/add-on-removed.event';

export class Subscription {
  // Identity (immutable)
  private readonly id: string;
  private readonly userId: string;

  // Mutable state
  private planId: string;
  private status: SubscriptionStatus;

  // Lifecycle dates
  private readonly startDate: Date;
  private endDate: Date | null;

  // Billing period
  private currentPeriodStart: Date;
  private currentPeriodEnd: Date | null;

  // Auto-renewal
  private autoRenew: boolean;

  // Cancellation
  private canceledAt: Date | null;
  private cancelAtPeriodEnd: boolean;

  // Trial
  private trialEndsAt: Date | null;

  // Address and tax
  private billingAddress: BillingAddress | null;
  private taxRegionId: string | null;

  // Metadata
  private metadata: JsonMetadata | null;

  // Relations
  private addOns: SubscriptionAddOn[];
  private discounts: SubscriptionDiscount[];

  // Audit fields
  private readonly createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  // Domain Events
  private readonly events: DomainEvent[] = [];

  /**
   * Private constructor - use factory methods to create instances
   */
  private constructor(props: SubscriptionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.planId = props.planId;
    this.status = props.status;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.currentPeriodStart = props.currentPeriodStart;
    this.currentPeriodEnd = props.currentPeriodEnd;
    this.autoRenew = props.autoRenew;
    this.canceledAt = props.canceledAt;
    this.cancelAtPeriodEnd = props.cancelAtPeriodEnd;
    this.trialEndsAt = props.trialEndsAt;
    this.billingAddress = props.billingAddress;
    this.taxRegionId = props.taxRegionId;
    this.metadata = props.metadata;
    this.addOns = props.addOns || [];
    this.discounts = props.discounts || [];
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
    this.deletedAt = props.deletedAt || null;
  }

  /**
   * Factory method - reconstitute from persistence
   *
   * Use this when loading from database.
   *
   * @param props - Properties from persistence layer
   * @returns Reconstituted domain model
   */
  static reconstitute(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  // ========================================
  // DOMAIN BEHAVIORS
  // ========================================

  /**
   * ✅ RICH BEHAVIOR: Change Plan
   *
   * Encapsulates all business logic for changing subscription plan.
   * This is the core domain operation that was previously scattered
   * across 178 lines in the service.
   *
   * Business Rules:
   * - Cannot change to same plan
   * - Must be active to change
   * - Proration is calculated externally (Domain Service)
   * - Add-ons are migrated based on new plan compatibility
   * - State is updated atomically
   *
   * @param newPlanId - ID of the new plan
   * @param effectiveDate - When the change takes effect
   * @param prorationResult - Pre-calculated proration (from Domain Service)
   * @param addOnMigrationResult - Pre-migrated add-ons (from Domain Service)
   * @returns Structured result with all change details
   * @throws DomainError if business rules are violated
   */
  changePlan(
    newPlanId: string,
    effectiveDate: Date,
    prorationResult: ProrationResult,
    addOnMigrationResult: AddOnMigrationResult,
  ): PlanChangeResult {
    // ✅ Business Rule: Cannot change to same plan
    if (this.planId === newPlanId) {
      throw new DomainError('Already on this plan');
    }

    // ✅ Business Rule: Must be active
    if (!this.isActive()) {
      throw new DomainError('Cannot change plan of inactive subscription');
    }

    // Store old plan for result
    const oldPlanId = this.planId;

    // ✅ Update internal state
    this.planId = newPlanId;
    this.addOns = addOnMigrationResult.remainingAddOns;
    this.updatedAt = new Date();

    // ✅ Collect Domain Events
    this.addEvent(
      new SubscriptionPlanChangedEvent(
        this.id,
        this.userId,
        oldPlanId,
        this.planId,
        prorationResult.credit,
        prorationResult.charge,
        addOnMigrationResult.removed.length,
        effectiveDate,
      ),
    );

    // ✅ Event for removed add-ons (if any)
    if (addOnMigrationResult.removed.length > 0) {
      this.addEvent(
        new AddOnsRemovedEvent(
          this.id,
          addOnMigrationResult.removed.map((a) => a.id),
          'Incompatible with new plan',
        ),
      );
    }

    // ✅ Return structured result
    return {
      oldPlanId,
      newPlanId: this.planId,
      prorationCredit: prorationResult.credit,
      prorationCharge: prorationResult.charge,
      addOnsRemoved: addOnMigrationResult.removed.length,
    };
  }

  // ========================================
  // QUERY METHODS (Business Logic)
  // ========================================

  /**
   * ✅ Business Logic: Check if subscription is active
   */
  isActive(): boolean {
    return this.status === SubscriptionStatus.Active;
  }

  /**
   * ✅ Business Logic: Check if subscription is in trial
   *
   * Uses trialEndsAt field instead of status enum (which only has Active/Inactive)
   */
  isInTrial(): boolean {
    if (!this.trialEndsAt) {
      return false;
    }
    return this.trialEndsAt > new Date();
  }

  /**
   * ✅ Business Logic: Check if subscription is cancelled
   *
   * Uses canceledAt field instead of status enum (which only has Active/Inactive)
   */
  isCancelled(): boolean {
    return this.canceledAt !== null;
  }

  /**
   * ✅ Business Logic: Check if subscription is inactive
   */
  isInactive(): boolean {
    return this.status === SubscriptionStatus.Inactive;
  }

  /**
   * ✅ Business Logic: Check if current period has ended
   *
   * @throws DomainError if currentPeriodEnd is null
   */
  hasCurrentPeriodEnded(): boolean {
    if (!this.currentPeriodEnd) {
      throw new DomainError(
        'Cannot check period end: currentPeriodEnd is null',
      );
    }
    return new Date() > this.currentPeriodEnd;
  }

  /**
   * ✅ Business Logic: Get days remaining in current period
   *
   * @throws DomainError if currentPeriodEnd is null
   */
  getDaysRemainingInPeriod(): number {
    if (!this.currentPeriodEnd) {
      throw new DomainError(
        'Cannot calculate days remaining: currentPeriodEnd is null',
      );
    }

    const now = new Date();
    const end = this.currentPeriodEnd;
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * ✅ Business Logic: Check if auto-renew is enabled
   */
  willAutoRenew(): boolean {
    return this.autoRenew && !this.cancelAtPeriodEnd;
  }

  /**
   * ✅ Business Logic: Get active discounts
   *
   * Returns all subscription discounts (filtering would need endDate field)
   */
  getActiveDiscounts(): SubscriptionDiscount[] {
    // Note: SubscriptionDiscount entity doesn't have endDate field
    // Return all discounts for now - filtering can be added if needed
    return this.discounts;
  }

  /**
   * ✅ Business Logic: Get billing address with default
   *
   * Returns default US address if none is set
   */
  getBillingAddressOrDefault(): BillingAddress {
    return (
      this.billingAddress || {
        addressLine1: '',
        city: '',
        state: '',
        zipcode: '',
        country: 'US',
      }
    );
  }

  // ========================================
  // GETTERS (Encapsulation)
  // ========================================

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getPlanId(): string {
    return this.planId;
  }

  getStatus(): SubscriptionStatus {
    return this.status;
  }

  getStartDate(): Date {
    return this.startDate;
  }

  getEndDate(): Date | null {
    return this.endDate;
  }

  getCurrentPeriodStart(): Date {
    return this.currentPeriodStart;
  }

  getCurrentPeriodEnd(): Date | null {
    return this.currentPeriodEnd;
  }

  getAutoRenew(): boolean {
    return this.autoRenew;
  }

  getCanceledAt(): Date | null {
    return this.canceledAt;
  }

  getCancelAtPeriodEnd(): boolean {
    return this.cancelAtPeriodEnd;
  }

  getTrialEndsAt(): Date | null {
    return this.trialEndsAt;
  }

  getBillingAddress(): BillingAddress | null {
    return this.billingAddress ? { ...this.billingAddress } : null;
  }

  getTaxRegionId(): string | null {
    return this.taxRegionId;
  }

  getMetadata(): JsonMetadata | null {
    return this.metadata ? { ...this.metadata } : null;
  }

  /**
   * Returns readonly copy to prevent external mutation
   */
  getAddOns(): readonly SubscriptionAddOn[] {
    return [...this.addOns];
  }

  /**
   * Returns readonly copy to prevent external mutation
   */
  getDiscounts(): readonly SubscriptionDiscount[] {
    return [...this.discounts];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  // ========================================
  // FUTURE DOMAIN BEHAVIORS (Stubs)
  // ========================================

  /**
   * TODO: Implement in Phase 5

  // ========================================
  // DOMAIN EVENT METHODS
  // ========================================

  /**
   * Add domain event to collection
   *
   * Events are collected during domain operations and later
   * published by the application service after successful persistence.
   *
   * @param event - Domain event to collect
   */
  private addEvent(event: DomainEvent): void {
    this.events.push(event);
  }

  /**
   * Get all collected events
   *
   * Returns a readonly copy to prevent external modification.
   * Called by application service to publish events.
   *
   * @returns Readonly array of domain events
   */
  getEvents(): readonly DomainEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events
   *
   * Called by application service after successful event publishing
   * to prevent duplicate publishing.
   */
  clearEvents(): void {
    this.events.length = 0;
  }

  // ========================================
  // ADDITIONAL DOMAIN BEHAVIORS
  // ========================================

  /**
   * Activate subscription
   *
   * Business Rules:
   * - Cannot activate already active subscription
   * - Sets status to Active
   * - Updates timestamp
   * - Publishes SubscriptionActivatedEvent
   *
   * @throws {DomainError} If subscription is already active
   */
  activate(): void {
    if (this.status === SubscriptionStatus.Active) {
      throw new DomainError('Subscription is already active');
    }

    this.status = SubscriptionStatus.Active;
    this.updatedAt = new Date();

    // Publish domain event
    this.addEvent(new SubscriptionActivatedEvent(this.id, this.userId));
  }

  /**
   * Cancel subscription
   *
   * Business Rules:
   * - Can only cancel active subscriptions
   * - Sets status to Inactive
   * - Records cancellation timestamp
   * - Publishes SubscriptionCancelledEvent with reason
   *
   * @param reason - Optional reason for cancellation (defaults to 'User requested')
   * @throws {DomainError} If subscription is not active
   */
  cancel(reason?: string): void {
    if (!this.isActive()) {
      throw new DomainError('Can only cancel active subscriptions');
    }

    this.status = SubscriptionStatus.Inactive;
    this.canceledAt = new Date();
    this.updatedAt = new Date();

    // Publish domain event
    this.addEvent(
      new SubscriptionCancelledEvent(
        this.id,
        this.userId,
        reason || 'User requested',
      ),
    );
  }

  /**
   * Add add-on to subscription
   *
   * Business Rules:
   * - Can only add add-ons to active subscriptions
   * - Quantity must be positive
   * - Cannot add duplicate add-on (use update instead)
   * - Publishes AddOnAddedEvent
   *
   * @param addOnId - ID of the add-on to add
   * @param quantity - Quantity of add-on (must be positive)
   * @throws {DomainError} If subscription is not active, quantity is invalid, or add-on already exists
   */
  addAddOn(addOnId: string, quantity: number): void {
    if (!this.isActive()) {
      throw new DomainError('Can only add add-ons to active subscriptions');
    }

    if (quantity <= 0) {
      throw new DomainError('Quantity must be positive');
    }

    // Check if already has this add-on
    const existing = this.addOns.find((a: any) => a.addOnId === addOnId);
    if (existing) {
      throw new DomainError('Add-on already present. Use update instead.');
    }

    // Note: Actual SubscriptionAddOn entity will be created by repository/mapper
    // Domain model just tracks the intent
    this.updatedAt = new Date();

    // Publish domain event
    this.addEvent(new AddOnAddedEvent(this.id, addOnId, quantity));
  }

  /**
   * Remove add-on from subscription
   *
   * Business Rules:
   * - Can only remove add-ons from active subscriptions
   * - Add-on must exist on subscription
   * - Updates internal collection
   * - Publishes AddOnRemovedEvent
   *
   * @param addOnId - ID of the add-on to remove
   * @throws {DomainError} If subscription is not active or add-on not found
   */
  removeAddOn(addOnId: string): void {
    if (!this.isActive()) {
      throw new DomainError(
        'Can only remove add-ons from active subscriptions',
      );
    }

    const index = this.addOns.findIndex((a: any) => a.addOnId === addOnId);
    if (index === -1) {
      throw new DomainError('Add-on not found');
    }

    // Remove from collection
    this.addOns.splice(index, 1);
    this.updatedAt = new Date();

    // Publish domain event
    this.addEvent(new AddOnRemovedEvent(this.id, addOnId));
  }
}
