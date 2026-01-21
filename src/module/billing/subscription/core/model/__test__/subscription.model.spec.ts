/**
 * SUBSCRIPTION DOMAIN MODEL - UNIT TESTS
 *
 * Tests for the rich domain model, focusing on business logic and encapsulation.
 * These tests are isolated from infrastructure (no database, no TypeORM).
 */

import { Subscription } from '../subscription.model';
import { SubscriptionStatus } from '@billingModule/subscription/core/enum/subscription-status.enum';
import { DomainError } from '../subscription.types';

describe('Subscription Domain Model', () => {
  describe('reconstitute', () => {
    it('should create subscription from props', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });

      expect(subscription).toBeInstanceOf(Subscription);
      expect(subscription.getId()).toBe('sub-123');
      expect(subscription.getPlanId()).toBe('plan-basic');
    });
  });

  describe('changePlan', () => {
    let subscription: Subscription;

    beforeEach(() => {
      subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });
    });

    it('should successfully change plan', () => {
      const newPlanId = 'plan-premium';
      const effectiveDate = new Date();
      const prorationResult = {
        credit: 10,
        charge: 20,
        creditBreakdown: [],
        chargeBreakdown: [],
      };
      const addOnMigrationResult = {
        remainingAddOns: [],
        removed: [],
        kept: [],
      };

      const result = subscription.changePlan(
        newPlanId,
        effectiveDate,
        prorationResult,
        addOnMigrationResult,
      );

      expect(result.oldPlanId).toBe('plan-basic');
      expect(result.newPlanId).toBe('plan-premium');
      expect(result.prorationCredit).toBe(10);
      expect(result.prorationCharge).toBe(20);
      expect(result.addOnsRemoved).toBe(0);
      expect(subscription.getPlanId()).toBe('plan-premium');
    });

    it('should throw DomainError when changing to same plan', () => {
      const samePlanId = 'plan-basic';
      const effectiveDate = new Date();
      const prorationResult = {
        credit: 0,
        charge: 0,
        creditBreakdown: [],
        chargeBreakdown: [],
      };
      const addOnMigrationResult = {
        remainingAddOns: [],
        removed: [],
        kept: [],
      };

      expect(() =>
        subscription.changePlan(
          samePlanId,
          effectiveDate,
          prorationResult,
          addOnMigrationResult,
        ),
      ).toThrow(DomainError);

      expect(() =>
        subscription.changePlan(
          samePlanId,
          effectiveDate,
          prorationResult,
          addOnMigrationResult,
        ),
      ).toThrow('Already on this plan');
    });

    it('should throw DomainError when subscription is not active', () => {
      const inactiveSubscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Inactive,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      const newPlanId = 'plan-premium';
      const effectiveDate = new Date();
      const prorationResult = {
        credit: 10,
        charge: 20,
        creditBreakdown: [],
        chargeBreakdown: [],
      };
      const addOnMigrationResult = {
        remainingAddOns: [],
        removed: [],
        kept: [],
      };

      expect(() =>
        inactiveSubscription.changePlan(
          newPlanId,
          effectiveDate,
          prorationResult,
          addOnMigrationResult,
        ),
      ).toThrow('Cannot change plan of inactive subscription');
    });

    it('should track removed add-ons', () => {
      const newPlanId = 'plan-premium';
      const effectiveDate = new Date();
      const prorationResult = {
        credit: 10,
        charge: 20,
        creditBreakdown: [],
        chargeBreakdown: [],
      };
      const addOnMigrationResult = {
        remainingAddOns: [],
        removed: [{ id: 'addon-1' }, { id: 'addon-2' }] as any,
        kept: [],
      };

      const result = subscription.changePlan(
        newPlanId,
        effectiveDate,
        prorationResult,
        addOnMigrationResult,
      );

      expect(result.addOnsRemoved).toBe(2);
    });

    it('should update internal addOns state', () => {
      const newPlanId = 'plan-premium';
      const effectiveDate = new Date();
      const prorationResult = {
        credit: 10,
        charge: 20,
        creditBreakdown: [],
        chargeBreakdown: [],
      };
      const remainingAddOn = { id: 'addon-kept' } as any;
      const addOnMigrationResult = {
        remainingAddOns: [remainingAddOn],
        removed: [{ id: 'addon-removed' }] as any,
        kept: [remainingAddOn],
      };

      subscription.changePlan(
        newPlanId,
        effectiveDate,
        prorationResult,
        addOnMigrationResult,
      );

      const addOns = subscription.getAddOns();
      expect(addOns).toHaveLength(1);
      expect(addOns[0]).toBe(remainingAddOn);
    });
  });

  describe('isActive', () => {
    it('should return true for active subscription', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date(),
        endDate: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      expect(subscription.isActive()).toBe(true);
    });

    it('should return false for inactive subscription', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Inactive,
        startDate: new Date(),
        endDate: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      expect(subscription.isActive()).toBe(false);
    });
  });

  describe('isInTrial', () => {
    it('should return true when trial has not ended', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date(),
        endDate: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: futureDate,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      expect(subscription.isInTrial()).toBe(true);
    });

    it('should return false when trial has ended', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date(),
        endDate: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: pastDate,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      expect(subscription.isInTrial()).toBe(false);
    });

    it('should return false when no trial', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date(),
        endDate: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      expect(subscription.isInTrial()).toBe(false);
    });
  });

  describe('isCancelled', () => {
    it('should return true when canceled', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date(),
        endDate: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: true,
        canceledAt: new Date(),
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      expect(subscription.isCancelled()).toBe(true);
    });

    it('should return false when not canceled', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date(),
        endDate: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      expect(subscription.isCancelled()).toBe(false);
    });
  });

  describe('getDaysRemainingInPeriod', () => {
    it('should calculate days remaining correctly', () => {
      const now = new Date('2026-01-15T00:00:00Z');
      const periodEnd = new Date('2026-02-01T00:00:00Z');

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: periodEnd,
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      const days = subscription.getDaysRemainingInPeriod();

      expect(days).toBeGreaterThan(0);
      expect(days).toBeLessThanOrEqual(17);

      jest.useRealTimers();
    });

    it('should return 0 when period has ended', () => {
      const now = new Date('2026-02-15T00:00:00Z');
      const periodEnd = new Date('2026-02-01T00:00:00Z');

      jest.useFakeTimers();
      jest.setSystemTime(now);

      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: periodEnd,
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      const days = subscription.getDaysRemainingInPeriod();

      expect(days).toBe(0);

      jest.useRealTimers();
    });

    it('should throw when currentPeriodEnd is null', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: null,
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      expect(() => subscription.getDaysRemainingInPeriod()).toThrow(
        DomainError,
      );
      expect(() => subscription.getDaysRemainingInPeriod()).toThrow(
        'Cannot calculate days remaining: currentPeriodEnd is null',
      );
    });
  });

  describe('willAutoRenew', () => {
    it('should return true when autoRenew is enabled and not canceling at period end', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date(),
        endDate: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      expect(subscription.willAutoRenew()).toBe(true);
    });

    it('should return false when autoRenew is disabled', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date(),
        endDate: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: false,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      expect(subscription.willAutoRenew()).toBe(false);
    });

    it('should return false when canceling at period end', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date(),
        endDate: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: true,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      expect(subscription.willAutoRenew()).toBe(false);
    });
  });

  describe('encapsulation', () => {
    it('should not allow direct modification of addOns array', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date(),
        endDate: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
      });

      const addOns = subscription.getAddOns();
      (addOns as any).push({ id: 'hacked' });

      expect(subscription.getAddOns().length).toBe(0);
    });

    it('should not expose setters for critical fields', () => {
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date(),
        endDate: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      expect((subscription as any).setPlanId).toBeUndefined();
      expect((subscription as any).setStatus).toBeUndefined();
      expect((subscription as any).setUserId).toBeUndefined();
    });

    it('should return copy of billingAddress to prevent mutation', () => {
      const originalAddress = {
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipcode: '10001',
        country: 'US',
      };

      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date(),
        endDate: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: originalAddress,
        taxRegionId: null,
        metadata: null,
      });

      const address = subscription.getBillingAddress();
      if (address) {
        address.city = 'Hacked City';
      }

      const addressAgain = subscription.getBillingAddress();
      expect(addressAgain?.city).toBe('New York');
    });
  });

  // ========================================
  // Phase 5: Additional Domain Behaviors
  // ========================================

  describe('activate()', () => {
    it('should activate an inactive subscription', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Inactive,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });

      subscription.activate();

      expect(subscription.getStatus()).toBe(SubscriptionStatus.Active);
      expect(subscription.getEvents()).toHaveLength(1);
      expect(subscription.getEvents()[0]).toMatchObject({
        eventType: 'SubscriptionActivated',
        aggregateId: 'test-subscription-id',
        userId: 'test-user-id',
      });
    });

    it('should throw error if subscription is already active', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });

      expect(() => subscription.activate()).toThrow(
        'Subscription is already active',
      );
    });
  });

  describe('cancel()', () => {
    it('should cancel an active subscription with reason', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });

      const reason = 'User requested cancellation';
      subscription.cancel(reason);

      expect(subscription.getStatus()).toBe(SubscriptionStatus.Inactive);
      expect(subscription.getCanceledAt()).toBeDefined();
      expect(subscription.getEvents()).toHaveLength(1);
      expect(subscription.getEvents()[0]).toMatchObject({
        eventType: 'SubscriptionCancelled',
        aggregateId: 'test-subscription-id',
        userId: 'test-user-id',
        reason,
      });
    });

    it('should cancel with default reason if not provided', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });

      subscription.cancel();

      expect(subscription.getStatus()).toBe(SubscriptionStatus.Inactive);
      expect(subscription.getEvents()[0]).toMatchObject({
        reason: 'User requested',
      });
    });

    it('should throw error if subscription is not active', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Inactive,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });

      expect(() => subscription.cancel()).toThrow(
        'Can only cancel active subscriptions',
      );
    });
  });

  describe('addAddOn()', () => {
    it('should add an add-on to active subscription', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });

      subscription.addAddOn('addon-123', 2);

      expect(subscription.getEvents()).toHaveLength(1);
      expect(subscription.getEvents()[0]).toMatchObject({
        eventType: 'AddOnAdded',
        aggregateId: 'test-subscription-id',
        addOnId: 'addon-123',
        quantity: 2,
      });
    });

    it('should throw error if subscription is not active', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Inactive,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });

      expect(() => subscription.addAddOn('addon-123', 1)).toThrow(
        'Can only add add-ons to active subscriptions',
      );
    });

    it('should throw error if quantity is zero or negative', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });

      expect(() => subscription.addAddOn('addon-123', 0)).toThrow(
        'Quantity must be positive',
      );
      expect(() => subscription.addAddOn('addon-123', -1)).toThrow(
        'Quantity must be positive',
      );
    });

    it('should throw error if add-on already exists', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [{ addOnId: 'addon-123' } as any],
        discounts: [],
      });

      expect(() => subscription.addAddOn('addon-123', 1)).toThrow(
        'Add-on already present',
      );
    });
  });

  describe('removeAddOn()', () => {
    it('should remove an add-on from active subscription', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [{ addOnId: 'addon-123' } as any],
        discounts: [],
      });

      subscription.removeAddOn('addon-123');

      expect(subscription.getAddOns()).toHaveLength(0);
      expect(subscription.getEvents()).toHaveLength(1);
      expect(subscription.getEvents()[0]).toMatchObject({
        eventType: 'AddOnRemoved',
        aggregateId: 'test-subscription-id',
        addOnId: 'addon-123',
      });
    });

    it('should throw error if subscription is not active', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Inactive,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [{ addOnId: 'addon-123' } as any],
        discounts: [],
      });

      expect(() => subscription.removeAddOn('addon-123')).toThrow(
        'Can only remove add-ons from active subscriptions',
      );
    });

    it('should throw error if add-on not found', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });

      expect(() => subscription.removeAddOn('addon-999')).toThrow(
        'Add-on not found',
      );
    });
  });

  describe('Future behaviors (Phase 6+)', () => {
    it('activate() should activate subscription', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Inactive,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });

      expect(() => subscription.activate()).not.toThrow();
    });

    it('cancel() should cancel subscription', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });

      expect(() => subscription.cancel()).not.toThrow();
    });

    it('addAddOn() should add add-on', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
      });

      expect(() => subscription.addAddOn('addon-123', 1)).not.toThrow();
    });

    it('removeAddOn() should remove add-on', () => {
      const subscription = Subscription.reconstitute({
        id: 'test-subscription-id',
        userId: 'test-user-id',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [{ addOnId: 'addon-123' } as any],
        discounts: [],
      });

      expect(() => subscription.removeAddOn('addon-123')).not.toThrow();
    });
  });
});
