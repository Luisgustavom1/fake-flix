import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { testDbClient } from '@testInfra/knex.database';
import { createNestApp } from '@testInfra/test-e2e.setup';
import { Tables } from '@testInfra/enum/tables.enum';
import { ChangePlanUseCase } from '../../change-plan.use-case';
import { BillingModule } from '@billingModule/billing.module';
import { planFactory } from '@billingModule/__test__/factory/plan.factory';
import { subscriptionFactory } from '@billingModule/__test__/factory/subscription.factory';
import { SubscriptionStatus } from '@billingModule/subscription/core/enum/subscription-status.enum';
import { PlanInterval } from '@billingModule/subscription/core/enum/plan-interval.enum';
import { faker } from '@faker-js/faker';

describe('ChangePlanUseCase - Integration', () => {
  let module: TestingModule;
  let app: INestApplication;
  let changePlanUseCase: ChangePlanUseCase;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([BillingModule]);
    app = nestTestSetup.app;
    module = nestTestSetup.module;
    changePlanUseCase = module.get<ChangePlanUseCase>(ChangePlanUseCase);
  }, 30000); // 30 seconds timeout for setup

  afterEach(async () => {
    // Clean up in reverse dependency order (BillingInvoice references Subscription)
    await testDbClient(Tables.BillingInvoiceLineItem).del();
    await testDbClient(Tables.BillingInvoice).del();
    await testDbClient(Tables.Subscription).del();
    await testDbClient(Tables.Plan).del();
  });

  afterAll(async () => {
    await app.close();
    await module.close();
  });

  describe('execute', () => {
    it('should successfully change plan using domain model', async () => {
      // Arrange - Create plans in database
      const basicPlan = planFactory.build({
        name: 'Basic Plan',
        amount: 9.99,
        currency: 'USD',
        interval: PlanInterval.Month,
      });

      const premiumPlan = planFactory.build({
        name: 'Premium Plan',
        amount: 19.99,
        currency: 'USD',
        interval: PlanInterval.Month,
      });

      await testDbClient(Tables.Plan).insert([basicPlan, premiumPlan]);

      // Create active subscription
      const subscription = subscriptionFactory.build({
        userId: 'user-123',
        planId: basicPlan.id,
        status: SubscriptionStatus.Active,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        startDate: new Date('2026-01-01'),
        autoRenew: true,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialEndsAt: null,
      });

      await testDbClient(Tables.Subscription).insert(subscription);

      // Act - Execute use case
      const result = await changePlanUseCase.execute({
        userId: subscription.userId!,
        subscriptionId: subscription.id!,
        newPlanId: premiumPlan.id!,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.subscriptionId).toBe(subscription.id);
      expect(result.oldPlanId).toBe(basicPlan.id);
      expect(result.newPlanId).toBe(premiumPlan.id);
      expect(result.invoiceId).toBeDefined();
      expect(result.prorationCredit).toBeGreaterThanOrEqual(0);
      expect(result.prorationCharge).toBeGreaterThanOrEqual(0);

      // Verify subscription was updated in database
      const updatedSubscription = await testDbClient(Tables.Subscription)
        .where({ id: subscription.id })
        .first();

      expect(updatedSubscription).toBeDefined();
      expect(updatedSubscription.planId).toBe(premiumPlan.id);
    });

    it('should throw error if subscription not found', async () => {
      // Act & Assert - Try to change plan for non-existent subscription (with valid UUID)
      await expect(
        changePlanUseCase.execute({
          userId: faker.string.uuid(),
          subscriptionId: faker.string.uuid(),
          newPlanId: faker.string.uuid(),
        }),
      ).rejects.toThrow('Subscription not found or does not belong to user');
    });

    it('should throw error if plan not found', async () => {
      // Arrange - Create subscription but no target plan
      const plan = planFactory.build({
        name: 'Basic Plan',
        amount: 9.99,
        currency: 'USD',
        interval: PlanInterval.Month,
      });

      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: 'user-123',
        planId: plan.id,
        status: SubscriptionStatus.Active,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
      });

      await testDbClient(Tables.Subscription).insert(subscription);

      // Act & Assert - Try to change to non-existent plan (with valid UUID)
      await expect(
        changePlanUseCase.execute({
          userId: subscription.userId!,
          subscriptionId: subscription.id!,
          newPlanId: faker.string.uuid(),
        }),
      ).rejects.toThrow('Plan not found');
    });

    it('should prevent changing to same plan (domain rule)', async () => {
      // Arrange - Create plan and subscription
      const plan = planFactory.build({
        name: 'Basic Plan',
        amount: 9.99,
        currency: 'USD',
        interval: PlanInterval.Month,
      });

      await testDbClient(Tables.Plan).insert(plan);

      const subscription = subscriptionFactory.build({
        userId: 'user-123',
        planId: plan.id,
        status: SubscriptionStatus.Active,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
      });

      await testDbClient(Tables.Subscription).insert(subscription);

      // Act & Assert - Try to change to same plan (domain rule violation)
      await expect(
        changePlanUseCase.execute({
          userId: subscription.userId!,
          subscriptionId: subscription.id!,
          newPlanId: plan.id!, // Same plan!
        }),
      ).rejects.toThrow('Already on this plan');
    });

    it('should prevent changing plan for inactive subscription (domain rule)', async () => {
      // Arrange - Create plans
      const basicPlan = planFactory.build({
        name: 'Basic Plan',
        amount: 9.99,
        currency: 'USD',
        interval: PlanInterval.Month,
      });

      const premiumPlan = planFactory.build({
        name: 'Premium Plan',
        amount: 19.99,
        currency: 'USD',
        interval: PlanInterval.Month,
      });

      await testDbClient(Tables.Plan).insert([basicPlan, premiumPlan]);

      // Create INACTIVE subscription
      const subscription = subscriptionFactory.build({
        userId: 'user-123',
        planId: basicPlan.id,
        status: SubscriptionStatus.Inactive, // Inactive!
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
      });

      await testDbClient(Tables.Subscription).insert(subscription);

      // Act & Assert - Try to change plan (domain rule violation)
      await expect(
        changePlanUseCase.execute({
          userId: subscription.userId!,
          subscriptionId: subscription.id!,
          newPlanId: premiumPlan.id!,
        }),
      ).rejects.toThrow('Cannot change plan of inactive subscription');
    });
  });
});
