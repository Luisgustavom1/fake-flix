import { Injectable } from '@nestjs/common';
import { NotFoundDomainException } from '@sharedLibs/core/exception/not-found-domain.exception';

import { PlanRepository } from '@billingModule/persistence/repository/plan.repository';
import { SubscriptionRepository } from '@billingModule/persistence/repository/subscription.repository';
import { Subscription } from '@billingModule/persistence/entity/subscription.entity';
import { SubscriptionStatus } from '../enum/subscription-status.enum';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async createSubscription({
    planId,
  }: {
    planId: string;
  }): Promise<Subscription> {
    const plan = await this.planRepository.findOneById(planId);
    if (!plan) {
      throw new NotFoundDomainException(`Plan with id ${planId} not found`);
    }
    const subscription = new Subscription({
      planId,
      userId: 'fake-user-id', // Replace with actual user ID
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
      throw new NotFoundDomainException(
        `Subscription for user with id ${userId} not found`,
      );
    }
    return subscription.status === SubscriptionStatus.Active;
  }
}
