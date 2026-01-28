/**
 * Command pattern for input
 */
export interface ChangePlanCommand {
  userId: string;
  subscriptionId: string;
  newPlanId: string;
  effectiveDate?: Date;
  chargeImmediately?: boolean;
  keepAddOns?: boolean;
}

/**
 * Result pattern for output
 */
export interface ChangePlanResult {
  subscriptionId: string;
  oldPlanId: string;
  newPlanId: string;
  invoiceId: string;
  immediateCharge: number;
  nextBillingDate: Date;
  prorationCredit: number;
  prorationCharge: number;
  addOnsRemoved: number;
}
