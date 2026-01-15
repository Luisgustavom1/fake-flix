# Fase 3: Invoice Builder (Domain Service)

**Duração**: 1 semana  
**Objetivo**: Extrair construção de invoice para Domain Service  
**Status**: ⏳ Pendente

---

## 🎯 Objetivos

1. Criar `InvoiceBuilder` Domain Service
2. Extrair ~40 linhas de lógica do Use Case
3. Simplificar Use Case para ~30 linhas
4. Manter lógica de invoice testável e reutilizável

---

## 📋 Pré-requisitos

- [ ] Fase 2 completa e validada
- [ ] Use Case funcionando e testado
- [ ] Dual support validado

---

## 🔧 Implementação

### Passo 1: Criar Invoice Builder Domain Service

```typescript
// src/module/billing/invoice/core/service/invoice-builder.service.ts

import { Injectable } from '@nestjs/common';
import { Subscription } from '@billingModule/subscription/core/model/subscription.model';
import { Plan } from '@billingModule/subscription/persistence/entity/plan.entity';
import { Invoice } from '@billingModule/invoice/persistence/entity/invoice.entity';
import { InvoiceLineItem } from '@billingModule/invoice/persistence/entity/invoice-line-item.entity';
import { ChargeType } from '@billingModule/shared/core/enum/charge-type.enum';
import { TaxCalculatorService } from '@billingModule/tax/core/service/tax-calculator.service';
import { DiscountEngineService } from '@billingModule/discount/core/service/discount-engine.service';
import { CreditManagerService } from '@billingModule/credit/core/service/credit-manager.service';
import { InvoiceGeneratorService } from '@billingModule/invoice/core/service/invoice-generator.service';
import { TaxConfiguration } from '@billingModule/tax/core/interface/tax-calculation.interface';
import { TaxProvider } from '@billingModule/tax/core/enum/tax-provider.enum';

/**
 * INVOICE BUILDER - Domain Service
 *
 * Stateless domain service responsible for building complete invoices
 * for various scenarios (plan change, monthly billing, etc.)
 *
 * This extracts ~40 lines of invoice construction logic from Use Cases,
 * making it reusable and testable independently.
 *
 * Domain Service Characteristics:
 * - Stateless
 * - Pure business logic
 * - Reusable across multiple use cases
 * - Lives in Domain Layer (not Application Layer)
 */
@Injectable()
export class InvoiceBuilder {
  constructor(
    private readonly taxCalculator: TaxCalculatorService,
    private readonly discountEngine: DiscountEngineService,
    private readonly creditManager: CreditManagerService,
    private readonly invoiceGenerator: InvoiceGeneratorService,
  ) {}

  /**
   * Build invoice for plan change
   *
   * @param subscription - Subscription domain model
   * @param newPlan - New plan entity
   * @param prorationResult - Proration calculation result
   * @param usageCharges - Usage charges for the period
   * @param chargeImmediately - Whether to charge immediately
   * @returns Complete invoice with all charges applied
   */
  async buildForPlanChange(
    subscription: Subscription,
    newPlan: Plan,
    prorationResult: {
      credit: number;
      charge: number;
      creditBreakdown: any[];
      chargeBreakdown: any[];
    },
    usageCharges: any[],
    chargeImmediately: boolean = false,
  ): Promise<Invoice> {
    // 1. Build line items
    const lineItems = this.buildLineItems(
      prorationResult,
      usageCharges,
      subscription,
    );

    // 2. Calculate taxes
    await this.calculateTaxes(lineItems, subscription);

    // 3. Apply discounts
    await this.applyDiscounts(lineItems, subscription);

    // 4. Generate invoice
    const invoice = await this.invoiceGenerator.generateInvoice(
      subscription as any, // TODO: Interface comum
      lineItems,
      {
        dueDate: new Date(),
        immediateCharge: chargeImmediately,
      },
    );

    // 5. Apply credits
    await this.applyCredits(invoice, subscription.getUserId());

    return invoice;
  }

  /**
   * Build line items from proration and usage
   */
  private buildLineItems(
    prorationResult: any,
    usageCharges: any[],
    subscription: Subscription,
  ): InvoiceLineItem[] {
    const items: InvoiceLineItem[] = [];

    // Proration credit lines
    for (const line of prorationResult.creditBreakdown) {
      items.push(
        new InvoiceLineItem({
          description: line.description,
          chargeType: ChargeType.Proration,
          quantity: 1,
          unitPrice: line.amount,
          amount: line.amount,
          taxAmount: 0,
          taxRate: 0,
          discountAmount: 0,
          totalAmount: line.amount,
          periodStart: line.periodStart,
          periodEnd: line.periodEnd,
          prorationRate: line.prorationRate,
          metadata: null,
        }),
      );
    }

    // Proration charge lines
    for (const line of prorationResult.chargeBreakdown) {
      items.push(
        new InvoiceLineItem({
          description: line.description,
          chargeType: ChargeType.Proration,
          quantity: 1,
          unitPrice: line.amount,
          amount: line.amount,
          taxAmount: 0,
          taxRate: 0,
          discountAmount: 0,
          totalAmount: line.amount,
          periodStart: line.periodStart,
          periodEnd: line.periodEnd,
          prorationRate: line.prorationRate,
          metadata: null,
        }),
      );
    }

    // Usage charge lines
    for (const usage of usageCharges) {
      items.push(
        new InvoiceLineItem({
          description: usage.description,
          chargeType: ChargeType.Usage,
          quantity: usage.quantity,
          unitPrice: usage.amount / usage.quantity,
          amount: usage.amount,
          taxAmount: 0,
          taxRate: 0,
          discountAmount: 0,
          totalAmount: usage.amount,
          periodStart: subscription.getCurrentPeriodStart(),
          periodEnd: new Date(),
          metadata: { tiers: usage.tiers },
        }),
      );
    }

    return items;
  }

  /**
   * Calculate taxes for line items
   */
  private async calculateTaxes(
    lineItems: InvoiceLineItem[],
    subscription: Subscription,
  ): Promise<void> {
    const taxConfig = await this.getTaxConfiguration(subscription.getUserId());
    const billingAddress = subscription.getBillingAddress() || {
      addressLine1: '',
      city: '',
      state: '',
      zipcode: '',
      country: 'US',
    };

    await this.taxCalculator.calculateLineTaxes(
      lineItems,
      taxConfig,
      billingAddress,
    );
  }

  /**
   * Apply discounts to line items
   */
  private async applyDiscounts(
    lineItems: InvoiceLineItem[],
    subscription: Subscription,
  ): Promise<void> {
    // TODO: Get discounts from subscription once Domain Model supports it
    const discounts: any[] = [];

    await this.discountEngine.applyDiscounts(lineItems, discounts, {
      cascading: true,
      excludeUsageCharges: false,
    });
  }

  /**
   * Apply available credits to invoice
   */
  private async applyCredits(invoice: Invoice, userId: string): Promise<void> {
    const credits = await this.creditManager.getUserAvailableCredits(userId);
    const applications = await this.creditManager.applyCreditsToInvoice(
      invoice,
      credits,
    );

    invoice.totalCredit = applications.reduce((sum, c) => sum + c.amount, 0);
    invoice.amountDue = Math.max(0, invoice.total - invoice.totalCredit);
  }

  /**
   * Get tax configuration for user
   */
  private async getTaxConfiguration(userId: string): Promise<TaxConfiguration> {
    // TODO: Load from database/config based on userId
    return {
      enabled: true,
      provider: TaxProvider.Standard,
      businessAddress: {
        addressLine1: '123 Business St',
        city: 'San Francisco',
        state: 'CA',
        zipcode: '94105',
        country: 'US',
      },
      easyTaxEnabled: false,
    };
  }
}
```

### Passo 2: Simplificar Use Case

```typescript
// src/module/billing/subscription/core/use-case/change-plan.use-case.ts
// (Atualizar método execute)

@Transactional({ connectionName: 'billing' })
async execute(command: ChangePlanCommand): Promise<ChangePlanResult> {
  // 1. Load Aggregates
  const subscription = await this.subscriptionRepository.findByIdAndUserIdAsDomain(
    command.subscriptionId,
    command.userId,
  );

  if (!subscription) {
    throw new NotFoundException('Subscription not found or does not belong to user');
  }

  const newPlan = await this.planRepository.findOneById(command.newPlanId);
  if (!newPlan) {
    throw new NotFoundException('Plan not found');
  }

  const effectiveDate = command.effectiveDate || new Date();

  // 2. Calculate Proration
  const prorationCredit = await this.prorationCalculator.calculateProrationCredit(
    subscription,
    new Date(),
    effectiveDate,
  );

  const prorationCharge = await this.prorationCalculator.calculateProrationCharge(
    newPlan,
    effectiveDate,
    subscription.getCurrentPeriodEnd(),
  );

  const prorationResult = {
    credit: prorationCredit.credit || 0,
    charge: prorationCharge.charge || 0,
    creditBreakdown: prorationCredit.breakdown || [],
    chargeBreakdown: prorationCharge.breakdown || [],
  };

  // 3. Migrate Add-Ons
  const addOnMigrationResult = await this.addOnManager.migrateAddOns(
    subscription.getAddOns() as any,
    newPlan.allowedAddOns || [],
    effectiveDate,
  );

  // 4. Calculate Usage
  const usageCharges = await this.usageBilling.calculateUsageCharges(
    subscription as any,
    subscription.getCurrentPeriodStart(),
    effectiveDate,
  );

  // 5. ✅ DOMAIN LOGIC
  const planChangeResult = subscription.changePlan(
    command.newPlanId,
    effectiveDate,
    prorationResult,
    addOnMigrationResult,
  );

  // 6. Save Subscription
  await this.subscriptionRepository.saveDomain(subscription);

  // 7. ✅ Build Invoice (delegated to Domain Service)
  const invoice = await this.invoiceBuilder.buildForPlanChange(
    subscription,
    newPlan,
    prorationResult,
    usageCharges,
    command.chargeImmediately || false,
  );

  // 8. Log Success
  this.logger.log('Plan change completed', {
    userId: command.userId,
    subscriptionId: subscription.getId(),
    oldPlan: planChangeResult.oldPlanId,
    newPlan: planChangeResult.newPlanId,
    prorationCredit: planChangeResult.prorationCredit,
    prorationCharge: planChangeResult.prorationCharge,
  });

  // 9. Return Result
  return {
    subscriptionId: subscription.getId(),
    oldPlanId: planChangeResult.oldPlanId,
    newPlanId: planChangeResult.newPlanId,
    invoiceId: invoice.id,
    immediateCharge: invoice.amountDue,
    nextBillingDate: subscription.getCurrentPeriodEnd(),
    prorationCredit: planChangeResult.prorationCredit,
    prorationCharge: planChangeResult.prorationCharge,
    addOnsRemoved: planChangeResult.addOnsRemoved,
  };
}
```

### Passo 3: Adicionar InvoiceBuilder ao Module

```typescript
// src/module/billing/invoice/invoice.module.ts

import { Module } from '@nestjs/common';
import { InvoiceBuilder } from './core/service/invoice-builder.service';
import { TaxCalculatorService } from '@billingModule/tax/core/service/tax-calculator.service';
import { DiscountEngineService } from '@billingModule/discount/core/service/discount-engine.service';
import { CreditManagerService } from '@billingModule/credit/core/service/credit-manager.service';
import { InvoiceGeneratorService } from './core/service/invoice-generator.service';

@Module({
  providers: [
    InvoiceBuilder,
    TaxCalculatorService,
    DiscountEngineService,
    CreditManagerService,
    InvoiceGeneratorService,
  ],
  exports: [InvoiceBuilder],
})
export class InvoiceModule {}
```

### Passo 4: Criar Testes do Invoice Builder

```typescript
// src/module/billing/invoice/core/service/__test__/invoice-builder.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceBuilder } from '../invoice-builder.service';
import { Subscription } from '@billingModule/subscription/core/model/subscription.model';
import { SubscriptionStatus } from '@billingModule/subscription/core/enum/subscription-status.enum';

describe('InvoiceBuilder', () => {
  let builder: InvoiceBuilder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceBuilder,
        {
          provide: TaxCalculatorService,
          useValue: {
            calculateLineTaxes: jest.fn(),
          },
        },
        {
          provide: DiscountEngineService,
          useValue: {
            applyDiscounts: jest.fn(),
          },
        },
        {
          provide: CreditManagerService,
          useValue: {
            getUserAvailableCredits: jest.fn().mockResolvedValue([]),
            applyCreditsToInvoice: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: InvoiceGeneratorService,
          useValue: {
            generateInvoice: jest.fn().mockResolvedValue({
              id: 'invoice-123',
              total: 100,
              amountDue: 100,
              totalCredit: 0,
            }),
          },
        },
      ],
    }).compile();

    builder = module.get<InvoiceBuilder>(InvoiceBuilder);
  });

  it('should build invoice for plan change', async () => {
    // Arrange
    const subscription = Subscription.reconstitute({
      id: 'sub-123',
      userId: 'user-456',
      planId: 'plan-basic',
      status: SubscriptionStatus.Active,
      currentPeriodStart: new Date('2026-01-01'),
      currentPeriodEnd: new Date('2026-02-01'),
    });

    const newPlan = {
      id: 'plan-premium',
      name: 'Premium',
      amount: 49.99,
    };

    const prorationResult = {
      credit: 10,
      charge: 20,
      creditBreakdown: [
        {
          description: 'Credit',
          amount: 10,
          periodStart: new Date(),
          periodEnd: new Date(),
          prorationRate: 0.5,
        },
      ],
      chargeBreakdown: [
        {
          description: 'Charge',
          amount: 20,
          periodStart: new Date(),
          periodEnd: new Date(),
          prorationRate: 0.5,
        },
      ],
    };

    const usageCharges = [
      {
        description: 'Data usage',
        amount: 5,
        quantity: 100,
        tiers: [],
      },
    ];

    // Act
    const invoice = await builder.buildForPlanChange(
      subscription,
      newPlan as any,
      prorationResult,
      usageCharges,
      false,
    );

    // Assert
    expect(invoice).toBeDefined();
    expect(invoice.id).toBe('invoice-123');
  });

  // Add more tests...
});
```

---

## ✅ Checklist de Validação

- [ ] `InvoiceBuilder` Domain Service criado
- [ ] Lógica de invoice extraída do Use Case
- [ ] Use Case simplificado (~30 linhas agora)
- [ ] Use Case injeta e usa `InvoiceBuilder`
- [ ] Testes unitários do `InvoiceBuilder`
- [ ] Testes E2E ainda passando
- [ ] Invoice builder pode ser reutilizado em outros contextos
- [ ] Todos os testes passando ✅

---

## 🧪 Como Testar

```bash
# Testar Invoice Builder
npm run test -- invoice/core/service

# Testar Use Case (deve estar mais simples)
npm run test -- subscription/core/use-case

# Testar E2E (deve continuar passando)
npm run test:e2e -- change-plan.spec.ts
```

---

## 📊 Resultados Esperados

1. ✅ `InvoiceBuilder` com ~100 linhas (lógica extraída)
2. ✅ Use Case com ~30 linhas (50% menor que antes)
3. ✅ Lógica de invoice testável isoladamente
4. ✅ Reutilizável em outros use cases (monthly billing, etc)

---

## 📝 Próximos Passos

Após completar esta fase:

1. Validar que tudo ainda funciona
2. Considerar usar `InvoiceBuilder` em outros contextos
3. Avançar para [PHASE-4-DOMAIN-EVENTS.md](./PHASE-4-DOMAIN-EVENTS.md)

---

**Status**: ⏳ Aguardando execução  
**Fase Anterior**: [PHASE-2-USE-CASE.md](./PHASE-2-USE-CASE.md)  
**Próxima Fase**: [PHASE-4-DOMAIN-EVENTS.md](./PHASE-4-DOMAIN-EVENTS.md)
