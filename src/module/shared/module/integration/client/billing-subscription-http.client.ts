import { Injectable } from '@nestjs/common';
import { BillingSubscriptionStatusApi } from '../interface/billing-integration.interface';
import { HttpClient } from '@sharedModule/http/client/http.client';
import { ConfigService } from '@nestjs/config';
import {
  BillingApiSubscriptionStatus,
  BillingApiSubscriptionStatusResponseDto,
} from '../http/dto/response/billing-api-subscription-status.dto';

@Injectable()
export class BillingSubscriptionHttpClient
  implements BillingSubscriptionStatusApi
{
  constructor(
    private readonly httpClient: HttpClient,
    private readonly configService: ConfigService,
  ) {}

  async isUserSubscriptionActive(userId: string): Promise<boolean> {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer PUT SOMETHING`,
      },
    };
    const url = `${
      this.configService.get('billingApi').url
    }/subscription/user/${userId}`;

    const response =
      await this.httpClient.get<BillingApiSubscriptionStatusResponseDto>(
        url,
        options,
      );

    return response.status === BillingApiSubscriptionStatus.Active
      ? true
      : false;
  }
}
