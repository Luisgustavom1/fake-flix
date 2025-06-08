import { SubscriptionService } from '@billingModule/core/service/subscription.service';
import { Injectable } from '@nestjs/common';
import { BillingSubscriptionApi } from '@sharedModule/integration/interface/billing-integration.interface';

@Injectable()
export class BillingSubscriptionProvider implements BillingSubscriptionApi {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async isUserSubscriptionActive(userId: string): Promise<boolean> {
    return await this.subscriptionService.isUserSubscriptionActive(userId);
  }
}
