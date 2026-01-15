/**
 * SUBSCRIPTION DOMAIN MODEL - TYPE DEFINITIONS
 *
 * This file contains all type definitions for the Subscription domain model.
 * These types are separate from ORM entities to maintain clean domain boundaries.
 *
 * Key Principles:
 * - IDs are simple strings (no Value Objects - pragmatic approach)
 * - All entity fields are included (not just Phase 1 subset)
 * - Nullable fields are explicitly marked
 */

import { SubscriptionStatus } from '@billingModule/subscription/core/enum/subscription-status.enum';
import { SubscriptionAddOn } from '@billingModule/subscription/persistence/entity/subscription-add-on.entity';
import { SubscriptionDiscount } from '@billingModule/subscription/persistence/entity/subscription-discount.entity';
import { BillingAddress } from '@billingModule/shared/core/interface/common.interface';

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
