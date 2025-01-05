export interface BillingSubscriptionApi {
  isUserSubscriptionActive(userId: string): Promise<boolean>;
}

export const BillingSubscriptionApi = Symbol('BillingSubscriptionApi');
