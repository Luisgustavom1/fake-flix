import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';
import { SubscriptionRepository } from '@billingModule/subscription/persistence/repository/subscription.repository';
import {
  IEventBus,
  EVENT_BUS,
} from '../../../../shared/core/event/event-bus.interface';

/**
 * Command for activating a subscription
 */
export interface ActivateSubscriptionCommand {
  subscriptionId: string;
  userId: string;
}

/**
 * Result from activating a subscription
 */
export interface ActivateSubscriptionResult {
  subscriptionId: string;
  activatedAt: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  message: string;
}

/**
 * ACTIVATE SUBSCRIPTION USE CASE
 *
 * Application layer orchestration for activating subscriptions.
 *
 * This provides a clean, focused use case that delegates to Domain Model.
 *
 * Key Features:
 * - Domain logic in Subscription.activate()
 * - Publishes SubscriptionActivatedEvent
 * - Clear command/result pattern
 * - Testable independently
 */
@Injectable()
export class ActivateSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly logger: AppLogger,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  /**
   * Execute use case
   *
   * @param command - Activate subscription command
   * @returns Structured result with activation details
   */
  @Transactional({ connectionName: 'billing' })
  async execute(
    command: ActivateSubscriptionCommand,
  ): Promise<ActivateSubscriptionResult> {
    // ========================================
    // 1. Load Subscription (Domain Model)
    // ========================================

    const subscription =
      await this.subscriptionRepository.findByIdAndUserIdAsDomain(
        command.subscriptionId,
        command.userId,
      );

    if (!subscription) {
      throw new NotFoundException(
        'Subscription not found or does not belong to user',
      );
    }

    // ========================================
    // 2. Domain Logic - Activate Subscription
    // ========================================

    subscription.activate();

    // ========================================
    // 3. Persist Domain Model
    // ========================================

    await this.subscriptionRepository.saveDomain(subscription);

    // ========================================
    // 4. Publish Domain Events
    // ========================================

    const events = subscription.getEvents();
    await this.eventBus.publishAll([...events]);
    subscription.clearEvents();

    // ========================================
    // 5. Log Success
    // ========================================

    this.logger.log('Subscription activated', {
      subscriptionId: subscription.getId(),
      userId: command.userId,
    });

    // ========================================
    // 6. Return Result
    // ========================================

    return {
      subscriptionId: subscription.getId(),
      activatedAt: new Date(),
      currentPeriodStart: subscription.getCurrentPeriodStart(),
      currentPeriodEnd: subscription.getCurrentPeriodEnd(),
      message: 'Subscription successfully activated',
    };
  }
}
