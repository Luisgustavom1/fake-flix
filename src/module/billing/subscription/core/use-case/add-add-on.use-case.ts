import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';
import { SubscriptionRepository } from '@billingModule/subscription/persistence/repository/subscription.repository';
import { AddOnRepository } from '@billingModule/subscription/persistence/repository/add-on.repository';
import {
  IEventBus,
  EVENT_BUS,
} from '../../../../shared/core/event/event-bus.interface';

/**
 * Command for adding an add-on to subscription
 */
export interface AddAddOnCommand {
  subscriptionId: string;
  userId: string;
  addOnId: string;
  quantity?: number;
}

/**
 * Result from adding an add-on
 */
export interface AddAddOnResult {
  subscriptionId: string;
  addOnId: string;
  quantity: number;
  message: string;
}

/**
 * ADD ADD-ON USE CASE
 *
 * Application layer orchestration for adding add-ons to subscriptions.
 *
 * This replaces the ~25-line method in SubscriptionBillingService.addAddOn()
 * with a clean, focused use case that delegates to Domain Model.
 *
 * Key Improvements:
 * - Domain logic in Subscription.addAddOn()
 * - Publishes domain events
 * - Clear command/result pattern
 * - Testable independently
 */
@Injectable()
export class AddAddOnUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly addOnRepository: AddOnRepository,
    private readonly logger: AppLogger,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  /**
   * Execute use case
   *
   * @param command - Add add-on command
   * @returns Structured result with confirmation
   */
  @Transactional({ connectionName: 'billing' })
  async execute(command: AddAddOnCommand): Promise<AddAddOnResult> {
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
    // 2. Validate Add-On Exists
    // ========================================

    const addOn = await this.addOnRepository.findById(command.addOnId);
    if (!addOn) {
      throw new NotFoundException('Add-on not found');
    }

    const quantity = command.quantity || 1;

    // ========================================
    // 3. Domain Logic - Add Add-On
    // ========================================

    subscription.addAddOn(command.addOnId, quantity);

    // ========================================
    // 4. Persist Domain Model
    // ========================================

    await this.subscriptionRepository.saveDomain(subscription);

    // ========================================
    // 5. Publish Domain Events
    // ========================================

    const events = subscription.getEvents();
    await this.eventBus.publishAll([...events]);
    subscription.clearEvents();

    // ========================================
    // 6. Log Success
    // ========================================

    this.logger.log('Add-on added to subscription', {
      subscriptionId: subscription.getId(),
      userId: command.userId,
      addOnId: command.addOnId,
      quantity,
    });

    // ========================================
    // 7. Return Result
    // ========================================

    return {
      subscriptionId: subscription.getId(),
      addOnId: command.addOnId,
      quantity,
      message: 'Add-on successfully added to subscription',
    };
  }
}
