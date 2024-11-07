import { Module } from '@nestjs/common';
import { SubscriptionService } from '@billingModule/core/service/subscription.service';
import { BillingPersistenceModule } from '@billingModule/persistence/billing-persistence.module';
import { SubscriptionController } from '@billingModule/core/controller/subscription.controller';

@Module({
  imports: [BillingPersistenceModule],
  providers: [SubscriptionService],
  controllers: [SubscriptionController],
  exports: [],
})
export class BillingModule {}
