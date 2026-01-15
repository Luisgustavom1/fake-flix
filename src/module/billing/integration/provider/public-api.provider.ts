import { SubscriptionService } from '@billingModule/subscription/core/service/subscription.service';
import { Injectable } from '@nestjs/common';
import { BillingSubscriptionApi } from '@sharedModule/integration/interface/billing-integration.interface';

@Injectable()
export class BillingPublicApiProvider implements BillingSubscriptionApi {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  public async isUserSubscriptionActive(userId: string): Promise<boolean> {
    return await this.subscriptionService.isUserSubscriptionActive(userId);
  }
}
