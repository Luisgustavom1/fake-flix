import { Module } from '@nestjs/common';
import { SubscriptionService } from '@billingModule/core/service/subscription.service';
import { BillingPersistenceModule } from '@billingModule/persistence/billing-persistence.module';
import { SubscriptionController } from '@billingModule/core/controller/subscription.controller';
import { BillingSubscriptionProvider } from './core/integration/provider/billing-subscription-status.provider';

@Module({
  imports: [BillingPersistenceModule],
  providers: [SubscriptionService, BillingSubscriptionProvider],
  controllers: [SubscriptionController],
  exports: [BillingSubscriptionProvider],
})
export class BillingModule {}
