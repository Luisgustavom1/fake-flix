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

// ========================================
// TYPE DEFINITIONS
// ========================================

/**
 * Properties to reconstitute a Subscription domain model
 */
export interface SubscriptionProps {
  // Identity
  id: string;
  userId: string;
  planId: string;

  // Status
  status: SubscriptionStatus;

  // Lifecycle dates
  startDate: Date;
  endDate: Date | null;

  // Billing period
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;

  // Auto-renewal
  autoRenew: boolean;

  // Cancellation
  canceledAt: Date | null;
  cancelAtPeriodEnd: boolean;

  // Trial
  trialEndsAt: Date | null;

  // Address and tax
  billingAddress: BillingAddress | null;
  taxRegionId: string | null;

  // Metadata
  metadata: JsonMetadata | null;

  // Relations
  addOns?: SubscriptionAddOn[];
  discounts?: SubscriptionDiscount[];

  // Audit fields
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Result of proration calculation (from ProrationCalculatorService)
 */
export interface ProrationResult {
  credit: number;
  charge: number;
  creditBreakdown: ProrationLineItem[];
  chargeBreakdown: ProrationLineItem[];
}

/**
 * Individual proration line item
 */
export interface ProrationLineItem {
  description: string;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  prorationRate: number;
}

/**
 * Result of add-on migration (from AddOnManagerService)
 */
export interface AddOnMigrationResult {
  remainingAddOns: SubscriptionAddOn[];
  removed: SubscriptionAddOn[];
  kept: SubscriptionAddOn[];
}

/**
 * Result of plan change operation
 */
export interface PlanChangeResult {
  oldPlanId: string;
  newPlanId: string;
  prorationCredit: number;
  prorationCharge: number;
  addOnsRemoved: number;
}

/**
 * Generic JSON metadata
 */
export interface JsonMetadata {
  [key: string]: any;
}

/**
 * Domain-specific error
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

// ========================================
// DOMAIN MODEL
// ========================================

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
   */
  activate(): void {
    throw new Error('Not implemented yet - Phase 5');
  }

  /**
   * TODO: Implement in Phase 5
   */
  cancel(): void {
    throw new Error('Not implemented yet - Phase 5');
  }

  /**
   * TODO: Implement in Phase 5
   */
  addAddOn(): void {
    throw new Error('Not implemented yet - Phase 5');
  }

  /**
   * TODO: Implement in Phase 5
   */
  removeAddOn(): void {
    throw new Error('Not implemented yet - Phase 5');
  }
}
