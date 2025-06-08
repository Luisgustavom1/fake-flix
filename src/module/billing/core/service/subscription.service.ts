import { Injectable, NotFoundException } from '@nestjs/common';

import { PlanRepository } from '@billingModule/persistence/repository/plan.repository';
import { SubscriptionRepository } from '@billingModule/persistence/repository/subscription.repository';
import { Subscription } from '@billingModule/persistence/entity/subscription.entity';
import { SubscriptionStatus } from '../enum/subscription-status.enum';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly clsService: ClsService,
  ) {}

  async createSubscription({
    planId,
  }: {
    planId: string;
  }): Promise<Subscription> {
    const plan = await this.planRepository.findOneById(planId);
    if (!plan) {
      throw new NotFoundException(`Plan with id ${planId} not found`);
    }
    const subscription = new Subscription({
      planId,
      userId: this.clsService.get('userId'),
      status: SubscriptionStatus.Active,
      startDate: new Date(),
      autoRenew: true,
    });
    await this.subscriptionRepository.save(subscription);
    return subscription;
  }

  async isUserSubscriptionActive(userId: string): Promise<boolean> {
    const subscription =
      await this.subscriptionRepository.findOneByUserId(userId);
    if (!subscription) {
      throw new NotFoundException(
        `Subscription for user with id ${userId} not found`,
      );
    }
    return subscription.status === SubscriptionStatus.Active;
  }
}
