import { Subscription } from '../subscription.model';
import { SubscriptionStatus } from '../../enum/subscription-status.enum';
import { SubscriptionPlanChangedEvent } from '../../event/subscription-plan-changed.event';
import { AddOnsRemovedEvent } from '../../event/add-ons-removed.event';

describe('Subscription Domain Model - Domain Events', () => {
  describe('Event Collection', () => {
    it('should collect SubscriptionPlanChangedEvent when plan changes', () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-15'),
        currentPeriodEnd: new Date('2026-02-15'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
      });

      const effectiveDate = new Date('2026-01-15');
      const prorationResult = {
        credit: 5.5,
        charge: 15.0,
        creditBreakdown: [],
        chargeBreakdown: [],
      };
      const addOnMigrationResult = {
        remainingAddOns: [],
        removed: [],
        kept: [],
      };

      // Act
      subscription.changePlan(
        'plan-premium',
        effectiveDate,
        prorationResult,
        addOnMigrationResult,
      );

      // Assert
      const events = subscription.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscriptionPlanChangedEvent);

      const event = events[0] as SubscriptionPlanChangedEvent;
      expect(event.eventType).toBe('SubscriptionPlanChanged');
      expect(event.aggregateId).toBe('sub-123');
      expect(event.userId).toBe('user-456');
      expect(event.oldPlanId).toBe('plan-basic');
      expect(event.newPlanId).toBe('plan-premium');
      expect(event.prorationCredit).toBe(5.5);
      expect(event.prorationCharge).toBe(15.0);
      expect(event.addOnsRemoved).toBe(0);
      expect(event.effectiveDate).toEqual(effectiveDate);
      expect(event.eventId).toBeDefined();
      expect(event.occurredOn).toBeInstanceOf(Date);
    });

    it('should collect AddOnsRemovedEvent when add-ons are removed during plan change', () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-15'),
        currentPeriodEnd: new Date('2026-02-15'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
      });

      const effectiveDate = new Date('2026-01-15');
      const prorationResult = {
        credit: 5.5,
        charge: 15.0,
        creditBreakdown: [],
        chargeBreakdown: [],
      };
      const addOnMigrationResult = {
        remainingAddOns: [],
        removed: [
          { id: 'addon-hd-streaming' },
          { id: 'addon-extra-profiles' },
        ] as any,
        kept: [],
      };

      // Act
      subscription.changePlan(
        'plan-premium',
        effectiveDate,
        prorationResult,
        addOnMigrationResult,
      );

      // Assert
      const events = subscription.getEvents();
      expect(events).toHaveLength(2); // PlanChanged + AddOnsRemoved

      const planChangedEvent = events[0] as SubscriptionPlanChangedEvent;
      expect(planChangedEvent.eventType).toBe('SubscriptionPlanChanged');
      expect(planChangedEvent.addOnsRemoved).toBe(2);

      const addOnsRemovedEvent = events[1] as AddOnsRemovedEvent;
      expect(addOnsRemovedEvent.eventType).toBe('AddOnsRemoved');
      expect(addOnsRemovedEvent.aggregateId).toBe('sub-123');
      expect(addOnsRemovedEvent.removedAddOnIds).toEqual([
        'addon-hd-streaming',
        'addon-extra-profiles',
      ]);
      expect(addOnsRemovedEvent.reason).toBe('Incompatible with new plan');
      expect(addOnsRemovedEvent.eventId).toBeDefined();
      expect(addOnsRemovedEvent.occurredOn).toBeInstanceOf(Date);
    });

    it('should NOT collect AddOnsRemovedEvent when no add-ons are removed', () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-15'),
        currentPeriodEnd: new Date('2026-02-15'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
      });

      const effectiveDate = new Date('2026-01-15');
      const prorationResult = {
        credit: 5.5,
        charge: 15.0,
        creditBreakdown: [],
        chargeBreakdown: [],
      };
      const addOnMigrationResult = {
        remainingAddOns: [{ id: 'addon-4k-streaming' }] as any,
        removed: [], // No add-ons removed
        kept: [{ id: 'addon-4k-streaming' }] as any,
      };

      // Act
      subscription.changePlan(
        'plan-premium',
        effectiveDate,
        prorationResult,
        addOnMigrationResult,
      );

      // Assert
      const events = subscription.getEvents();
      expect(events).toHaveLength(1); // Only PlanChanged
      expect(events[0].eventType).toBe('SubscriptionPlanChanged');
    });
  });

  describe('Event Management', () => {
    it('should return readonly copy of events via getEvents()', () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-15'),
        currentPeriodEnd: new Date('2026-02-15'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
      });

      subscription.changePlan(
        'plan-premium',
        new Date('2026-01-15'),
        { credit: 5.5, charge: 15.0, creditBreakdown: [], chargeBreakdown: [] },
        { remainingAddOns: [], removed: [], kept: [] },
      );

      // Act
      const events1 = subscription.getEvents();
      const events2 = subscription.getEvents();

      // Assert - Different array instances (defensive copy)
      expect(events1).not.toBe(events2);
      expect(events1).toHaveLength(1);
      expect(events2).toHaveLength(1);
      expect(events1[0]).toBe(events2[0]); // Same event objects
    });

    it('should clear all events via clearEvents()', () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-15'),
        currentPeriodEnd: new Date('2026-02-15'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
      });

      subscription.changePlan(
        'plan-premium',
        new Date('2026-01-15'),
        { credit: 5.5, charge: 15.0, creditBreakdown: [], chargeBreakdown: [] },
        {
          remainingAddOns: [],
          removed: [{ id: 'addon-1' }, { id: 'addon-2' }] as any,
          kept: [],
        },
      );

      // Act - Verify events exist
      expect(subscription.getEvents()).toHaveLength(2);

      // Act - Clear events
      subscription.clearEvents();

      // Assert - No events after clear
      expect(subscription.getEvents()).toHaveLength(0);
    });

    it('should accumulate events from multiple operations', () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-15'),
        currentPeriodEnd: new Date('2026-02-15'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
      });

      // Act - First plan change
      subscription.changePlan(
        'plan-premium',
        new Date('2026-01-15'),
        { credit: 5.5, charge: 15.0, creditBreakdown: [], chargeBreakdown: [] },
        { remainingAddOns: [], removed: [], kept: [] },
      );

      expect(subscription.getEvents()).toHaveLength(1);

      // Act - Second plan change (without clearing events)
      subscription.changePlan(
        'plan-enterprise',
        new Date('2026-01-16'),
        {
          credit: 10.0,
          charge: 30.0,
          creditBreakdown: [],
          chargeBreakdown: [],
        },
        { remainingAddOns: [], removed: [], kept: [] },
      );

      // Assert - Events accumulate
      expect(subscription.getEvents()).toHaveLength(2);

      const events = subscription.getEvents();
      expect(events[0].eventType).toBe('SubscriptionPlanChanged');
      expect((events[0] as any).newPlanId).toBe('plan-premium');

      expect(events[1].eventType).toBe('SubscriptionPlanChanged');
      expect((events[1] as any).newPlanId).toBe('plan-enterprise');
    });
  });

  describe('Event Serialization', () => {
    it('should serialize SubscriptionPlanChangedEvent to JSON', () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-15'),
        currentPeriodEnd: new Date('2026-02-15'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
      });

      const effectiveDate = new Date('2026-01-15T10:30:00.000Z');

      subscription.changePlan(
        'plan-premium',
        effectiveDate,
        { credit: 5.5, charge: 15.0, creditBreakdown: [], chargeBreakdown: [] },
        { remainingAddOns: [], removed: [], kept: [] },
      );

      // Act
      const events = subscription.getEvents();
      const event = events[0] as SubscriptionPlanChangedEvent;
      const json = event.toJSON();

      // Assert
      expect(json.eventType).toBe('SubscriptionPlanChanged');
      expect(json.eventVersion).toBe(1);
      expect(json.aggregateId).toBe('sub-123');
      expect(json.eventId).toBeDefined();
      expect(json.occurredOn).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format

      expect(json.payload).toEqual({
        userId: 'user-456',
        oldPlanId: 'plan-basic',
        newPlanId: 'plan-premium',
        prorationCredit: 5.5,
        prorationCharge: 15.0,
        addOnsRemoved: 0,
        effectiveDate: effectiveDate.toISOString(),
      });
    });

    it('should serialize AddOnsRemovedEvent to JSON', () => {
      // Arrange
      const subscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-15'),
        currentPeriodEnd: new Date('2026-02-15'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
        addOns: [],
        discounts: [],
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
      });

      subscription.changePlan(
        'plan-premium',
        new Date('2026-01-15'),
        { credit: 5.5, charge: 15.0, creditBreakdown: [], chargeBreakdown: [] },
        {
          remainingAddOns: [],
          removed: [{ id: 'addon-1' }, { id: 'addon-2' }] as any,
          kept: [],
        },
      );

      // Act
      const events = subscription.getEvents();
      const event = events[1] as AddOnsRemovedEvent;
      const json = event.toJSON();

      // Assert
      expect(json.eventType).toBe('AddOnsRemoved');
      expect(json.eventVersion).toBe(1);
      expect(json.aggregateId).toBe('sub-123');
      expect(json.eventId).toBeDefined();
      expect(json.occurredOn).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      expect(json.payload).toEqual({
        removedAddOnIds: ['addon-1', 'addon-2'],
        reason: 'Incompatible with new plan',
      });
    });
  });
});
