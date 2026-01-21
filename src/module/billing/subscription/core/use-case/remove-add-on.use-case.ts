import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';
import { SubscriptionRepository } from '@billingModule/subscription/persistence/repository/subscription.repository';
import {
  IEventBus,
  EVENT_BUS,
} from '../../../../shared/core/event/event-bus.interface';

/**
 * Command for removing an add-on from subscription
 */
export interface RemoveAddOnCommand {
  subscriptionId: string;
  userId: string;
  addOnId: string;
}

/**
 * Result from removing an add-on
 */
export interface RemoveAddOnResult {
  subscriptionId: string;
  addOnId: string;
  message: string;
}

/**
 * REMOVE ADD-ON USE CASE
 *
 * Application layer orchestration for removing add-ons from subscriptions.
 *
 * This provides a clean, focused use case that delegates to Domain Model.
 *
 * Key Features:
 * - Domain logic in Subscription.removeAddOn()
 * - Publishes domain events
 * - Clear command/result pattern
 * - Testable independently
 */
@Injectable()
export class RemoveAddOnUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly logger: AppLogger,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  /**
   * Execute use case
   *
   * @param command - Remove add-on command
   * @returns Structured result with confirmation
   */
  @Transactional({ connectionName: 'billing' })
  async execute(command: RemoveAddOnCommand): Promise<RemoveAddOnResult> {
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
    // 2. Domain Logic - Remove Add-On
    // ========================================

    subscription.removeAddOn(command.addOnId);

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

    this.logger.log('Add-on removed from subscription', {
      subscriptionId: subscription.getId(),
      userId: command.userId,
      addOnId: command.addOnId,
    });

    // ========================================
    // 6. Return Result
    // ========================================

    return {
      subscriptionId: subscription.getId(),
      addOnId: command.addOnId,
      message: 'Add-on successfully removed from subscription',
    };
  }
}
