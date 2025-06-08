import { Module } from '@nestjs/common';
import { SubscriptionService } from '@billingModule/core/service/subscription.service';
import { BillingPersistenceModule } from '@billingModule/persistence/billing-persistence.module';
import { SubscriptionController } from '@billingModule/http/rest/controller/subscription.controller';
import { BillingSubscriptionProvider } from './integration/provider/billing-subscription-status.provider';
import { AuthModule } from '@sharedModule/auth/auth.module';

@Module({
  imports: [BillingPersistenceModule, AuthModule],
  providers: [SubscriptionService, BillingSubscriptionProvider],
  controllers: [SubscriptionController],
  exports: [BillingSubscriptionProvider],
})
export class BillingModule {}
