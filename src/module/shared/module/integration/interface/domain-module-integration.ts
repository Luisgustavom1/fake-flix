import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingSubscriptionHttpClient } from '../client/billing-subscription-http.client';
import { HttpClientModule } from '@sharedModule/http/client/http.client module';

@Module({
  imports: [ConfigModule.forRoot(), HttpClientModule],
  providers: [BillingSubscriptionHttpClient],
  exports: [BillingSubscriptionHttpClient],
})
export class DomainModuleIntegration {}
