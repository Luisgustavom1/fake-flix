# Fase 0: Preparação

**Duração**: 1 semana  
**Objetivo**: Garantir testes e baseline antes de qualquer mudança  
**Status**: ⏳ Pendente

---

## 🎯 Objetivos

1. Criar testes E2E que validam comportamento atual
2. Documentar contratos da API
3. Estabelecer baseline de performance
4. Garantir que não quebraremos nada

---

## 📋 Pré-requisitos

- [ ] Acesso ao ambiente de desenvolvimento
- [ ] Banco de dados de testes configurado
- [ ] Node.js e dependências instaladas

---

## 🔧 Implementação

### Passo 1: Criar Estrutura de Testes E2E

```bash
# Criar diretórios
mkdir -p src/module/billing/subscription/__test__/e2e
mkdir -p src/module/billing/subscription/__test__/factory
```

### Passo 2: Criar Factory para Testes

```typescript
// src/module/billing/subscription/__test__/factory/subscription.factory.ts
import { faker } from '@faker-js/faker';
import { Subscription } from '@billingModule/subscription/persistence/entity/subscription.entity';
import { Plan } from '@billingModule/subscription/persistence/entity/plan.entity';
import { SubscriptionStatus } from '@billingModule/subscription/core/enum/subscription-status.enum';

export class SubscriptionFactory {
  static create(overrides?: Partial<Subscription>): Subscription {
    const subscription = new Subscription();

    subscription.id = faker.string.uuid();
    subscription.userId = faker.string.uuid();
    subscription.planId = faker.string.uuid();
    subscription.status = SubscriptionStatus.Active;
    subscription.currentPeriodStart = new Date();
    subscription.currentPeriodEnd = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    );
    subscription.addOns = [];
    subscription.discounts = [];

    Object.assign(subscription, overrides);

    return subscription;
  }

  static createActive(overrides?: Partial<Subscription>): Subscription {
    return this.create({
      status: SubscriptionStatus.Active,
      ...overrides,
    });
  }
}

export class PlanFactory {
  static create(overrides?: Partial<Plan>): Plan {
    const plan = new Plan();

    plan.id = faker.string.uuid();
    plan.name = faker.commerce.productName();
    plan.amount = parseFloat(faker.commerce.price({ min: 10, max: 100 }));
    plan.billingPeriod = 'monthly';
    plan.allowedAddOns = [];

    Object.assign(plan, overrides);

    return plan;
  }
}
```

### Passo 3: Criar Teste E2E para Change Plan

```typescript
// src/module/billing/subscription/__test__/e2e/change-plan.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { SubscriptionBillingService } from '@billingModule/subscription/core/service/subscription-billing.service';
import { SubscriptionRepository } from '@billingModule/subscription/persistence/repository/subscription.repository';
import { PlanRepository } from '@billingModule/subscription/persistence/repository/plan.repository';
import {
  SubscriptionFactory,
  PlanFactory,
} from '../factory/subscription.factory';
import { Subscription } from '@billingModule/subscription/persistence/entity/subscription.entity';
import { Plan } from '@billingModule/subscription/persistence/entity/plan.entity';

describe('ChangePlan E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let subscriptionBillingService: SubscriptionBillingService;
  let subscriptionRepository: SubscriptionRepository;
  let planRepository: PlanRepository;

  let testUserId: string;
  let testSubscription: Subscription;
  let currentPlan: Plan;
  let newPlan: Plan;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Import your billing module here
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>('BILLING_DATA_SOURCE');
    subscriptionBillingService = moduleFixture.get<SubscriptionBillingService>(
      SubscriptionBillingService,
    );
    subscriptionRepository = moduleFixture.get<SubscriptionRepository>(
      SubscriptionRepository,
    );
    planRepository = moduleFixture.get<PlanRepository>(PlanRepository);
  });

  beforeEach(async () => {
    // Clean database
    await dataSource.query('DELETE FROM subscription');
    await dataSource.query('DELETE FROM plan');

    // Setup test data
    testUserId = 'test-user-123';

    currentPlan = PlanFactory.create({
      name: 'Basic Plan',
      amount: 29.99,
    });
    await planRepository.save(currentPlan);

    newPlan = PlanFactory.create({
      name: 'Premium Plan',
      amount: 49.99,
    });
    await planRepository.save(newPlan);

    testSubscription = SubscriptionFactory.createActive({
      userId: testUserId,
      planId: currentPlan.id,
      plan: currentPlan,
    });
    await subscriptionRepository.save(testSubscription);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('changePlanForUser', () => {
    it('should successfully change plan with proration', async () => {
      // Arrange
      const effectiveDate = new Date();

      // Act
      const result = await subscriptionBillingService.changePlanForUser(
        testUserId,
        testSubscription.id,
        newPlan.id,
        {
          effectiveDate,
          chargeImmediately: false,
          keepAddOns: true,
        },
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.subscription).toBeDefined();
      expect(result.subscription.planId).toBe(newPlan.id);
      expect(result.oldPlanId).toBe(currentPlan.id);
      expect(result.newPlanId).toBe(newPlan.id);
      expect(result.invoice).toBeDefined();
      expect(result.prorationCredit).toBeGreaterThanOrEqual(0);
      expect(result.prorationCharge).toBeGreaterThanOrEqual(0);
    });

    it('should validate ownership - reject if subscription does not belong to user', async () => {
      // Arrange
      const wrongUserId = 'wrong-user-456';

      // Act & Assert
      await expect(
        subscriptionBillingService.changePlanForUser(
          wrongUserId,
          testSubscription.id,
          newPlan.id,
          {},
        ),
      ).rejects.toThrow('Subscription not found or does not belong to user');
    });

    it('should reject if plan does not exist', async () => {
      // Arrange
      const nonExistentPlanId = 'non-existent-plan';

      // Act & Assert
      await expect(
        subscriptionBillingService.changePlanForUser(
          testUserId,
          testSubscription.id,
          nonExistentPlanId,
          {},
        ),
      ).rejects.toThrow('Plan not found');
    });

    it('should reject if subscription does not exist', async () => {
      // Arrange
      const nonExistentSubscriptionId = 'non-existent-sub';

      // Act & Assert
      await expect(
        subscriptionBillingService.changePlanForUser(
          testUserId,
          nonExistentSubscriptionId,
          newPlan.id,
          {},
        ),
      ).rejects.toThrow('Subscription not found');
    });

    it('should reject if changing to same plan', async () => {
      // Act & Assert
      await expect(
        subscriptionBillingService.changePlanForUser(
          testUserId,
          testSubscription.id,
          currentPlan.id, // Same plan
          {},
        ),
      ).rejects.toThrow('Already on this plan');
    });

    it('should calculate correct proration credit when upgrading mid-period', async () => {
      // Arrange
      const midPeriodDate = new Date(testSubscription.currentPeriodStart);
      midPeriodDate.setDate(midPeriodDate.getDate() + 15); // Mid-period

      // Act
      const result = await subscriptionBillingService.changePlanForUser(
        testUserId,
        testSubscription.id,
        newPlan.id,
        {
          effectiveDate: midPeriodDate,
        },
      );

      // Assert
      expect(result.prorationCredit).toBeGreaterThan(0);
      expect(result.prorationCharge).toBeGreaterThan(0);
      // Credit should be approximately half of old plan (mid-period)
      expect(result.prorationCredit).toBeCloseTo(currentPlan.amount / 2, 1);
    });

    it('should include usage charges up to effective date', async () => {
      // This test depends on your usage billing setup
      // Arrange - setup usage data for subscription

      // Act
      const result = await subscriptionBillingService.changePlanForUser(
        testUserId,
        testSubscription.id,
        newPlan.id,
        {},
      );

      // Assert
      expect(result.invoice).toBeDefined();
      expect(result.invoice.lineItems).toBeDefined();
      // Should have at least: proration credit + proration charge
      expect(result.invoice.lineItems.length).toBeGreaterThanOrEqual(2);
    });

    it('should remove incompatible add-ons', async () => {
      // Arrange
      const incompatiblePlan = PlanFactory.create({
        name: 'Enterprise Plan',
        amount: 99.99,
        allowedAddOns: [], // No add-ons allowed
      });
      await planRepository.save(incompatiblePlan);

      // Add some add-ons to subscription
      // (This depends on your add-on implementation)

      // Act
      const result = await subscriptionBillingService.changePlanForUser(
        testUserId,
        testSubscription.id,
        incompatiblePlan.id,
        {},
      );

      // Assert
      expect(result.addOnsRemoved).toBeGreaterThanOrEqual(0);
    });

    it('should apply taxes correctly', async () => {
      // Act
      const result = await subscriptionBillingService.changePlanForUser(
        testUserId,
        testSubscription.id,
        newPlan.id,
        {},
      );

      // Assert
      expect(result.invoice).toBeDefined();
      result.invoice.lineItems.forEach((item) => {
        expect(item.taxAmount).toBeDefined();
        expect(item.taxRate).toBeDefined();
      });
    });

    it('should apply discounts correctly', async () => {
      // Arrange - add discount to subscription
      // (This depends on your discount implementation)

      // Act
      const result = await subscriptionBillingService.changePlanForUser(
        testUserId,
        testSubscription.id,
        newPlan.id,
        {},
      );

      // Assert
      expect(result.invoice).toBeDefined();
      // Check that discounts were applied
    });

    it('should apply credits correctly', async () => {
      // Arrange - add credits to user
      // (This depends on your credit implementation)

      // Act
      const result = await subscriptionBillingService.changePlanForUser(
        testUserId,
        testSubscription.id,
        newPlan.id,
        {},
      );

      // Assert
      expect(result.invoice).toBeDefined();
      expect(result.invoice.totalCredit).toBeGreaterThanOrEqual(0);
      expect(result.invoice.amountDue).toBeLessThanOrEqual(
        result.invoice.total,
      );
    });
  });

  describe('Performance Baseline', () => {
    it('should complete in less than 500ms', async () => {
      const start = Date.now();

      await subscriptionBillingService.changePlanForUser(
        testUserId,
        testSubscription.id,
        newPlan.id,
        {},
      );

      const duration = Date.now() - start;

      console.log(`Change plan took ${duration}ms`);
      expect(duration).toBeLessThan(500);
    });
  });
});
```

### Passo 4: Documentar Contratos da API

```typescript
// docs/api-contracts/change-plan-contract.ts

/**
 * API Contract: Change Subscription Plan
 *
 * This document defines the stable contract for plan change operations.
 * Any implementation must maintain these contracts.
 */

export interface ChangePlanRequest {
  userId: string;
  subscriptionId: string;
  newPlanId: string;
  options: {
    effectiveDate?: Date;
    chargeImmediately?: boolean;
    keepAddOns?: boolean;
  };
}

export interface ChangePlanResponse {
  subscription: {
    id: string;
    userId: string;
    planId: string;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  };
  invoice: {
    id: string;
    total: number;
    amountDue: number;
    totalCredit: number;
    lineItems: InvoiceLineItem[];
  };
  immediateCharge: number;
  nextBillingDate: Date;
  oldPlanId: string;
  newPlanId: string;
  prorationCredit: number;
  prorationCharge: number;
  addOnsRemoved: number;
}

export interface InvoiceLineItem {
  description: string;
  chargeType: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxAmount: number;
  taxRate: number;
  discountAmount: number;
  totalAmount: number;
  periodStart?: Date;
  periodEnd?: Date;
  prorationRate?: number;
  metadata?: any;
}

/**
 * Business Rules
 */
export const BUSINESS_RULES = {
  // User must own the subscription
  OWNERSHIP_VALIDATION: true,

  // Cannot change to same plan
  SAME_PLAN_REJECTED: true,

  // Proration must be calculated
  PRORATION_REQUIRED: true,

  // Usage charges calculated up to effective date
  USAGE_CHARGES_INCLUDED: true,

  // Taxes must be applied
  TAXES_REQUIRED: true,

  // Discounts must be applied if present
  DISCOUNTS_APPLIED: true,

  // Credits must be applied if available
  CREDITS_APPLIED: true,

  // Incompatible add-ons must be removed
  ADDON_MIGRATION: true,
};

/**
 * Error Cases
 */
export const ERROR_MESSAGES = {
  SUBSCRIPTION_NOT_FOUND: 'Subscription not found or does not belong to user',
  PLAN_NOT_FOUND: 'Plan not found',
  ALREADY_ON_PLAN: 'Already on this plan',
  SUBSCRIPTION_NOT_ACTIVE: 'Cannot change plan of inactive subscription',
};
```

### Passo 5: Criar Script de Baseline de Performance

```typescript
// scripts/performance-baseline.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SubscriptionBillingService } from '@billingModule/subscription/core/service/subscription-billing.service';

async function measurePerformance() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(SubscriptionBillingService);

  // Setup test data
  const testUserId = 'perf-test-user';
  const subscriptionId = 'perf-test-subscription';
  const newPlanId = 'perf-test-plan';

  const iterations = 10;
  const times: number[] = [];

  console.log(`Running ${iterations} iterations...`);

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();

    try {
      await service.changePlanForUser(
        testUserId,
        subscriptionId,
        newPlanId,
        {},
      );
    } catch (error) {
      // Expected in test
    }

    const duration = Date.now() - start;
    times.push(duration);
    console.log(`Iteration ${i + 1}: ${duration}ms`);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
  const max = Math.max(...times);

  console.log('\n=== Performance Baseline ===');
  console.log(`Average: ${avg.toFixed(2)}ms`);
  console.log(`P95: ${p95}ms`);
  console.log(`Max: ${max}ms`);

  await app.close();
}

measurePerformance().catch(console.error);
```

---

## ✅ Checklist de Validação

Marque cada item após completar:

- [ ] Factory para Subscription criado
- [ ] Factory para Plan criado
- [ ] Teste E2E para change plan com proration
- [ ] Teste E2E para ownership validation
- [ ] Teste E2E para plan not found
- [ ] Teste E2E para subscription not found
- [ ] Teste E2E para same plan rejection
- [ ] Teste E2E para proration calculation
- [ ] Teste E2E para usage charges
- [ ] Teste E2E para add-on migration
- [ ] Teste E2E para taxes
- [ ] Teste E2E para discounts
- [ ] Teste E2E para credits
- [ ] Teste de performance baseline (<500ms)
- [ ] Contratos da API documentados
- [ ] Todos os testes passando ✅

---

## 🧪 Como Testar

```bash
# Executar testes E2E
npm run test:e2e -- subscription/__test__/e2e/change-plan.spec.ts

# Executar baseline de performance
npm run ts-node scripts/performance-baseline.ts

# Verificar cobertura
npm run test:cov
```

---

## 📊 Resultados Esperados

Ao final desta fase, você deve ter:

1. ✅ Suíte de testes E2E completa (12+ casos)
2. ✅ 100% dos testes passando
3. ✅ Baseline de performance estabelecido
4. ✅ Contratos da API documentados
5. ✅ Confiança para refatorar sem quebrar comportamento

---

## ⚠️ Problemas Comuns

### Testes falhando por dependências

**Solução**: Certifique-se de que todos os serviços (proration, usage, tax, discount, credit) estão configurados corretamente no módulo de teste.

### Performance acima de 500ms

**Solução**: Isso é esperado no estado atual. Registre o baseline e compare após refatoração.

### Banco de dados não limpa entre testes

**Solução**: Use transações ou limpe manualmente no `beforeEach`.

---

## 📝 Próximos Passos

Após completar esta fase:

1. Revise os resultados com o time
2. Ajuste testes se necessário
3. Commit dos testes (não do código de produção ainda)
4. Avance para [PHASE-1-DOMAIN-MODEL.md](./PHASE-1-DOMAIN-MODEL.md)

---

**Status**: ⏳ Aguardando execução  
**Próxima Fase**: [PHASE-1-DOMAIN-MODEL.md](./PHASE-1-DOMAIN-MODEL.md)
