import { BillingSubscriptionRepository } from '@identityModule/persistence/repository/external/billing-subscription.repository';

export interface BillingSubscriptionStatusApi {
  isUserSubscriptionActive(userId: string): Promise<boolean>;
}

export const BillingSubscriptionStatusApi = Symbol(
  'BillingSubscriptionStatusApi',
);

export const BillingSubscriptionStatusApiProvider = {
  provide: BillingSubscriptionStatusApi,
  useExisting: BillingSubscriptionRepository,
};
