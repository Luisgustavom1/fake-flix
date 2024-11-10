import { SubscriptionStatus } from '@billingModule/core/model/subscription.model';
import { SubscriptionRepository } from '@billingModule/persistence/repository/subscription.repository';
import { Injectable } from '@nestjs/common';
import { BillingSubscriptionStatusApi } from '@sharedModule/integration/interface/billing-integration.interface';

@Injectable()
export class BillingSubscriptionStatusProvider
  implements BillingSubscriptionStatusApi
{
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async isUserSubscriptionActive(userId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);

    return subscription.status === SubscriptionStatus.Active;
  }
}
