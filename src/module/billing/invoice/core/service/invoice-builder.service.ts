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
 * This extracts ~130 lines of invoice construction logic from Use Cases,
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
      subscription as any, // Keep casting for Phase 3 (simple solution)
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _subscription: Subscription,
  ): Promise<void> {
    // Note: We need to get discounts from subscription entity still
    // This will be improved in later phases
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
  private async getTaxConfiguration(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _userId: string,
  ): Promise<TaxConfiguration> {
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
