import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceBuilder } from '../invoice-builder.service';
import { TaxCalculatorService } from '@billingModule/tax/core/service/tax-calculator.service';
import { DiscountEngineService } from '@billingModule/discount/core/service/discount-engine.service';
import { CreditManagerService } from '@billingModule/credit/core/service/credit-manager.service';
import { InvoiceGeneratorService } from '@billingModule/invoice/core/service/invoice-generator.service';
import { Subscription } from '@billingModule/subscription/core/model/subscription.model';
import { SubscriptionStatus } from '@billingModule/subscription/core/enum/subscription-status.enum';
import { Plan } from '@billingModule/subscription/persistence/entity/plan.entity';
import { Invoice } from '@billingModule/invoice/persistence/entity/invoice.entity';

describe('InvoiceBuilder', () => {
  let builder: InvoiceBuilder;
  let mockTaxCalculator: jest.Mocked<TaxCalculatorService>;
  let mockDiscountEngine: jest.Mocked<DiscountEngineService>;
  let mockCreditManager: jest.Mocked<CreditManagerService>;
  let mockInvoiceGenerator: jest.Mocked<InvoiceGeneratorService>;

  beforeEach(async () => {
    mockTaxCalculator = {
      calculateLineTaxes: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockDiscountEngine = {
      applyDiscounts: jest.fn().mockResolvedValue([]),
    } as any;

    mockCreditManager = {
      getUserAvailableCredits: jest.fn().mockResolvedValue([]),
      applyCreditsToInvoice: jest.fn().mockResolvedValue([]),
    } as any;

    mockInvoiceGenerator = {
      generateInvoice: jest.fn().mockResolvedValue({
        id: 'invoice-123',
        invoiceNumber: 'INV-2026-001',
        userId: 'user-456',
        subscriptionId: 'sub-123',
        subtotal: 100,
        totalTax: 10,
        totalDiscount: 0,
        totalCredit: 0,
        total: 110,
        amountDue: 110,
        currency: 'USD',
        dueDate: new Date(),
      } as Invoice),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceBuilder,
        {
          provide: TaxCalculatorService,
          useValue: mockTaxCalculator,
        },
        {
          provide: DiscountEngineService,
          useValue: mockDiscountEngine,
        },
        {
          provide: CreditManagerService,
          useValue: mockCreditManager,
        },
        {
          provide: InvoiceGeneratorService,
          useValue: mockInvoiceGenerator,
        },
      ],
    }).compile();

    builder = module.get<InvoiceBuilder>(InvoiceBuilder);
  });

  describe('buildForPlanChange', () => {
    it('should build invoice with proration credits, charges, and usage', async () => {
      // Arrange
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
      });

      const newPlan = {
        id: 'plan-premium',
        name: 'Premium',
        amount: 49.99,
      } as Plan;

      const prorationResult = {
        credit: 10,
        charge: 20,
        creditBreakdown: [
          {
            description: 'Prorated credit for Basic Plan',
            amount: -10,
            periodStart: new Date('2026-01-01'),
            periodEnd: new Date('2026-01-15'),
            prorationRate: 0.5,
          },
        ],
        chargeBreakdown: [
          {
            description: 'Prorated charge for Premium Plan',
            amount: 20,
            periodStart: new Date('2026-01-15'),
            periodEnd: new Date('2026-02-01'),
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
        newPlan,
        prorationResult,
        usageCharges,
        false,
      );

      // Assert
      expect(invoice).toBeDefined();
      expect(invoice.id).toBe('invoice-123');
      expect(mockTaxCalculator.calculateLineTaxes).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          enabled: true,
          provider: 'Standard',
        }),
        expect.any(Object),
      );
      expect(mockDiscountEngine.applyDiscounts).toHaveBeenCalledWith(
        expect.any(Array),
        [],
        expect.objectContaining({
          cascading: true,
          excludeUsageCharges: false,
        }),
      );
      expect(mockInvoiceGenerator.generateInvoice).toHaveBeenCalled();
      expect(mockCreditManager.getUserAvailableCredits).toHaveBeenCalledWith(
        'user-456',
      );
    });

    it('should build invoice with empty proration and usage charges', async () => {
      // Arrange
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
      });

      const newPlan = {
        id: 'plan-premium',
        name: 'Premium',
        amount: 49.99,
      } as Plan;

      const prorationResult = {
        credit: 0,
        charge: 0,
        creditBreakdown: [],
        chargeBreakdown: [],
      };

      const usageCharges = [];

      // Act
      const invoice = await builder.buildForPlanChange(
        subscription,
        newPlan,
        prorationResult,
        usageCharges,
        false,
      );

      // Assert
      expect(invoice).toBeDefined();
      expect(invoice.id).toBe('invoice-123');
      expect(mockInvoiceGenerator.generateInvoice).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([]),
        expect.objectContaining({
          dueDate: expect.any(Date),
          immediateCharge: false,
        }),
      );
    });

    it('should apply credits when available', async () => {
      // Arrange
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
      });

      const newPlan = {
        id: 'plan-premium',
        name: 'Premium',
        amount: 49.99,
      } as Plan;

      const prorationResult = {
        credit: 0,
        charge: 0,
        creditBreakdown: [],
        chargeBreakdown: [],
      };

      const usageCharges = [];

      mockCreditManager.getUserAvailableCredits.mockResolvedValue([
        {
          id: 'credit-1',
          userId: 'user-456',
          amount: 25,
          remainingAmount: 25,
        } as any,
      ]);

      mockCreditManager.applyCreditsToInvoice.mockResolvedValue([
        {
          creditId: 'credit-1',
          amount: 25,
          remainingCreditBalance: 0,
        },
      ]);

      // Act
      const invoice = await builder.buildForPlanChange(
        subscription,
        newPlan,
        prorationResult,
        usageCharges,
        false,
      );

      // Assert
      expect(invoice.totalCredit).toBe(25);
      expect(invoice.amountDue).toBe(85); // 110 - 25
      expect(mockCreditManager.applyCreditsToInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'invoice-123' }),
        expect.arrayContaining([expect.objectContaining({ id: 'credit-1' })]),
      );
    });

    it('should set chargeImmediately flag correctly', async () => {
      // Arrange
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
      });

      const newPlan = {
        id: 'plan-premium',
        name: 'Premium',
        amount: 49.99,
      } as Plan;

      const prorationResult = {
        credit: 0,
        charge: 0,
        creditBreakdown: [],
        chargeBreakdown: [],
      };

      const usageCharges = [];

      // Act
      await builder.buildForPlanChange(
        subscription,
        newPlan,
        prorationResult,
        usageCharges,
        true, // chargeImmediately
      );

      // Assert
      expect(mockInvoiceGenerator.generateInvoice).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          immediateCharge: true,
        }),
      );
    });

    it('should use default billing address when not available', async () => {
      // Arrange
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
      });

      const newPlan = {
        id: 'plan-premium',
        name: 'Premium',
        amount: 49.99,
      } as Plan;

      const prorationResult = {
        credit: 0,
        charge: 0,
        creditBreakdown: [],
        chargeBreakdown: [],
      };

      const usageCharges = [];

      // Act
      await builder.buildForPlanChange(
        subscription,
        newPlan,
        prorationResult,
        usageCharges,
        false,
      );

      // Assert
      expect(mockTaxCalculator.calculateLineTaxes).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Object),
        expect.objectContaining({
          addressLine1: '',
          city: '',
          state: '',
          zipcode: '',
          country: 'US',
        }),
      );
    });
  });
});
