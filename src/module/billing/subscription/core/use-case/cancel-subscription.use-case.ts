import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';
import { SubscriptionRepository } from '@billingModule/subscription/persistence/repository/subscription.repository';
import {
  IEventBus,
  EVENT_BUS,
} from '../../../../shared/core/event/event-bus.interface';

/**
 * Command for cancelling a subscription
 */
export interface CancelSubscriptionCommand {
  subscriptionId: string;
  userId: string;
  reason?: string;
}

/**
 * Result from cancelling a subscription
 */
export interface CancelSubscriptionResult {
  subscriptionId: string;
  cancelledAt: Date;
  reason: string;
  message: string;
}

/**
 * CANCEL SUBSCRIPTION USE CASE
 *
 * Application layer orchestration for cancelling subscriptions.
 *
 * This provides a clean, focused use case that delegates to Domain Model.
 *
 * Key Features:
 * - Domain logic in Subscription.cancel()
 * - Publishes SubscriptionCancelledEvent
 * - Clear command/result pattern
 * - Testable independently
 */
@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly logger: AppLogger,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  /**
   * Execute use case
   *
   * @param command - Cancel subscription command
   * @returns Structured result with cancellation details
   */
  @Transactional({ connectionName: 'billing' })
  async execute(
    command: CancelSubscriptionCommand,
  ): Promise<CancelSubscriptionResult> {
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

    const reason = command.reason || 'User requested';

    // ========================================
    // 2. Domain Logic - Cancel Subscription
    // ========================================

    subscription.cancel(reason);

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

    this.logger.log('Subscription cancelled', {
      subscriptionId: subscription.getId(),
      userId: command.userId,
      reason,
    });

    // ========================================
    // 6. Return Result
    // ========================================

    return {
      subscriptionId: subscription.getId(),
      cancelledAt: new Date(),
      reason,
      message: 'Subscription successfully cancelled',
    };
  }
}
