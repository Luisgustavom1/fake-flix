import { Injectable } from '@nestjs/common';
import { BillingSubscriptionApi } from '../interface/billing-integration.interface';
import { HttpClient } from '@sharedModule/http/client/http.client';
import { BillingApiSubscriptionStatusResponseDto } from '../http/dto/response/billing-api-subscription-status.dto';
import { ConfigService } from '@sharedModule/config/service/config.service';

@Injectable()
export class BillingSubscriptionHttpClient implements BillingSubscriptionApi {
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
    }/subscription/user/${userId}/active`;

    const { isActive } =
      await this.httpClient.get<BillingApiSubscriptionStatusResponseDto>(
        url,
        options,
      );

    return isActive;
  }
}
