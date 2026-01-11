import { SubscriptionService } from '../service/subscription.service';
import { Injectable } from '@nestjs/common';
import { BillingSubscriptionStatusApi } from '@sharedModule/integration/interface/billing-integration.interface';

@Injectable()
export class BillingPublicApiProvider implements BillingSubscriptionStatusApi {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  public async isUserSubscriptionActive(userId: string): Promise<boolean> {
    return await this.subscriptionService.isUserSubscriptionActive(userId);
  }
}
