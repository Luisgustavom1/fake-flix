import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SubscriptionService } from '@billingModule/core/service/subscription.service';
import { CreateSubscriptionRequestDto } from '@billingModule/http/rest/dto/request/create-subscription.dto';
import { SubscriptionResponseDto } from '@billingModule/http/rest/dto/response/subscription-response.dto';
import { plainToInstance } from 'class-transformer';
import { UserSubscriptionActiveResponseDto } from '@billingModule/http/rest/dto/response/user-subscription-active-response.dto';
import { AuthGuard } from '@sharedModule/auth/guard/auth.guard';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createSubscription(
    @Body() createSubscriptionRequest: CreateSubscriptionRequestDto,
  ): Promise<SubscriptionResponseDto> {
    const createdSubscription =
      await this.subscriptionService.createSubscription(
        createSubscriptionRequest,
      );

    return plainToInstance(
      SubscriptionResponseDto,
      { ...createdSubscription, ...{ plan: createdSubscription.plan } },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Get('/user/:userId/active')
  @UseGuards(AuthGuard)
  async isUserSubscriptionActive(
    userId: string,
  ): Promise<UserSubscriptionActiveResponseDto> {
    const isActive =
      await this.subscriptionService.isUserSubscriptionActive(userId);
    return plainToInstance(
      UserSubscriptionActiveResponseDto,
      { isActive },
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
