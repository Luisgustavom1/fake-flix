import { Expose, Type } from 'class-transformer';
import { ChangePlanResult } from '@billingModule/subscription/core/use-case/change-plan.types';

/**
 * Response DTO for Change Plan endpoint
 *
 * Adapts both Use Case and Transaction Script outputs
 * to provide consistent API response
 */
export class ChangePlanResponseDto {
  @Expose()
  subscriptionId: string;

  @Expose()
  oldPlanId: string;

  @Expose()
  newPlanId: string;

  @Expose()
  prorationCredit: number;

  @Expose()
  prorationCharge: number;

  @Expose()
  invoiceId: string;

  @Expose()
  amountDue: number;

  @Expose()
  @Type(() => Date)
  nextBillingDate: Date;

  @Expose()
  addOnsRemoved: number;

  /**
   * From Use Case Result
   */
  static fromUseCaseResult(result: ChangePlanResult): ChangePlanResponseDto {
    const dto = new ChangePlanResponseDto();
    dto.subscriptionId = result.subscriptionId;
    dto.oldPlanId = result.oldPlanId;
    dto.newPlanId = result.newPlanId;
    dto.invoiceId = result.invoiceId;
    dto.amountDue = result.immediateCharge;
    dto.nextBillingDate = result.nextBillingDate;
    dto.prorationCredit = result.prorationCredit;
    dto.prorationCharge = result.prorationCharge;
    dto.addOnsRemoved = result.addOnsRemoved;
    return dto;
  }

  /**
   * From Transaction Script Result (legacy)
   */
  static fromServiceResult(result: any): ChangePlanResponseDto {
    const dto = new ChangePlanResponseDto();
    dto.subscriptionId = result.subscription.id;
    dto.oldPlanId = result.oldPlanId;
    dto.newPlanId = result.newPlanId;
    dto.invoiceId = result.invoice.id;
    dto.amountDue = result.immediateCharge;
    dto.nextBillingDate = result.nextBillingDate;
    dto.prorationCredit = result.prorationCredit;
    dto.prorationCharge = result.prorationCharge;
    dto.addOnsRemoved = result.addOnsRemoved;
    return dto;
  }
}
