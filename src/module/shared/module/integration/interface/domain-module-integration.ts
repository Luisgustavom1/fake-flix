import { Module } from '@nestjs/common';
import { BillingSubscriptionHttpClient } from '../client/billing-subscription-http.client';
import { HttpClientModule } from '@sharedModule/http/client/http.client module';
import { ConfigModule } from '@sharedModule/config/config.module';

@Module({
  imports: [ConfigModule.forRoot(), HttpClientModule],
  providers: [BillingSubscriptionHttpClient],
  exports: [BillingSubscriptionHttpClient],
})
export class DomainModuleIntegration {}
