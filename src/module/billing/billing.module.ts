import { Module } from '@nestjs/common';
import { SubscriptionService } from '@billingModule/core/service/subscription.service';
import { BillingPersistenceModule } from '@billingModule/persistence/billing-persistence.module';
import { SubscriptionController } from '@billingModule/core/controller/subscription.controller';
import { BillingSubscriptionStatusProvider } from './core/integration/provider/public-api.provider';

@Module({
  imports: [BillingPersistenceModule],
  providers: [SubscriptionService, BillingSubscriptionStatusProvider],
  controllers: [SubscriptionController],
  exports: [BillingSubscriptionStatusProvider],
})
export class BillingModule {}
