import { Subscription } from '@billingModule/subscription/persistence/entity/subscription.entity';
import { Subscription as SubscriptionModel } from '@billingModule/subscription/core/model/subscription.model';
import { SubscriptionStatus } from '@billingModule/subscription/core/enum/subscription-status.enum';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DefaultTypeOrmRepository } from '@sharedModule/persistence/typeorm/repository/default-typeorm.repository';
import { DataSource } from 'typeorm';

@Injectable()
export class SubscriptionRepository extends DefaultTypeOrmRepository<Subscription> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource,
  ) {
    super(Subscription, dataSource.manager);
  }

  // ========================================
  // 🆕 NEW METHODS (Domain Model)
  // ========================================

  /**
   * Find subscription by ID and return as Domain Model
   *
   * Loads all necessary relations and converts to rich domain model.
   *
   * @param id - Subscription ID
   * @returns Domain Model or null if not found
   */
  async findByIdAsDomain(id: string): Promise<SubscriptionModel | null> {
    const entity = await this.findOne({
      where: { id },
      relations: [
        'plan',
        'addOns',
        'addOns.addOn',
        'discounts',
        'discounts.discount',
      ],
    });

    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Find active subscription by user ID and return as Domain Model
   *
   * @param userId - User ID
   * @returns Domain Model or null if not found
   */
  async findActiveByUserIdAsDomain(
    userId: string,
  ): Promise<SubscriptionModel | null> {
    const entity = await this.findOne({
      where: {
        userId,
        status: SubscriptionStatus.Active,
      },
      relations: [
        'plan',
        'addOns',
        'addOns.addOn',
        'discounts',
        'discounts.discount',
      ],
    });

    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Find subscription by ID and user ID (ownership validation)
   *
   * Use this when you need to verify the subscription belongs to the user.
   *
   * @param id - Subscription ID
   * @param userId - User ID
   * @returns Domain Model or null if not found or doesn't belong to user
   */
  async findByIdAndUserIdAsDomain(
    id: string,
    userId: string,
  ): Promise<SubscriptionModel | null> {
    const entity = await this.findOne({
      where: { id, userId },
      relations: [
        'plan',
        'addOns',
        'addOns.addOn',
        'discounts',
        'discounts.discount',
      ],
    });

    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Save Domain Model
   *
   * Handles both insert (new) and update (existing) cases.
   * Converts domain model back to ORM entity and persists.
   *
   * @param model - Domain Model to save
   */
  async saveDomain(model: SubscriptionModel): Promise<void> {
    const entity = await this.findOne({
      where: { id: model.getId() },
    });

    if (entity) {
      // Update existing
      this.updateEntity(entity, model);
      await this.save(entity);
    } else {
      // Insert new
      const newEntity = this.toEntity(model);
      await this.save(newEntity);
    }
  }

  // ========================================
  // PRIVATE MAPPERS (Domain <-> ORM)
  // ========================================

  /**
   * ORM Entity → Domain Model
   */
  private toDomain(entity: Subscription): SubscriptionModel {
    return SubscriptionModel.reconstitute({
      // Identity
      id: entity.id,
      userId: entity.userId,
      planId: entity.planId,

      // Status
      status: entity.status,

      // Lifecycle dates
      startDate: entity.startDate,
      endDate: entity.endDate,

      // Billing period
      currentPeriodStart: entity.currentPeriodStart,
      currentPeriodEnd: entity.currentPeriodEnd,

      // Auto-renewal
      autoRenew: entity.autoRenew,

      // Cancellation
      canceledAt: entity.canceledAt,
      cancelAtPeriodEnd: entity.cancelAtPeriodEnd,

      // Trial
      trialEndsAt: entity.trialEndsAt,

      // Address and tax
      billingAddress: entity.billingAddress
        ? {
            addressLine1: entity.billingAddress.addressLine1,
            addressLine2: entity.billingAddress.addressLine2,
            city: entity.billingAddress.city,
            state: entity.billingAddress.state,
            zipcode: entity.billingAddress.zipcode,
            country: entity.billingAddress.country,
          }
        : null,
      taxRegionId: entity.taxRegionId,

      // Metadata
      metadata: entity.metadata,

      // Relations
      addOns: entity.addOns || [],
      discounts: entity.discounts || [],

      // Audit fields
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }

  /**
   * Domain Model → ORM Entity (new)
   */
  private toEntity(model: SubscriptionModel): Subscription {
    const entity = new Subscription();

    // Identity
    entity.id = model.getId();
    entity.userId = model.getUserId();
    entity.planId = model.getPlanId();

    // Status
    entity.status = model.getStatus();

    // Lifecycle dates
    entity.startDate = model.getStartDate();
    entity.endDate = model.getEndDate();

    // Billing period
    entity.currentPeriodStart = model.getCurrentPeriodStart();
    entity.currentPeriodEnd = model.getCurrentPeriodEnd();

    // Auto-renewal
    entity.autoRenew = model.getAutoRenew();

    // Cancellation
    entity.canceledAt = model.getCanceledAt();
    entity.cancelAtPeriodEnd = model.getCancelAtPeriodEnd();

    // Trial
    entity.trialEndsAt = model.getTrialEndsAt();

    // Address and tax
    const billingAddress = model.getBillingAddress();
    if (billingAddress) {
      entity.billingAddress = {
        addressLine1: billingAddress.addressLine1,
        addressLine2: billingAddress.addressLine2,
        city: billingAddress.city,
        state: billingAddress.state,
        zipcode: billingAddress.zipcode,
        country: billingAddress.country,
      };
    } else {
      entity.billingAddress = null;
    }
    entity.taxRegionId = model.getTaxRegionId();

    // Metadata
    entity.metadata = model.getMetadata();

    // Audit fields
    entity.createdAt = model.getCreatedAt();
    entity.updatedAt = model.getUpdatedAt();
    entity.deletedAt = model.getDeletedAt();

    return entity;
  }

  /**
   * Update existing ORM Entity from Domain Model
   */
  private updateEntity(entity: Subscription, model: SubscriptionModel): void {
    // Update mutable fields only
    entity.planId = model.getPlanId();
    entity.status = model.getStatus();
    entity.endDate = model.getEndDate();
    entity.currentPeriodStart = model.getCurrentPeriodStart();
    entity.currentPeriodEnd = model.getCurrentPeriodEnd();
    entity.autoRenew = model.getAutoRenew();
    entity.canceledAt = model.getCanceledAt();
    entity.cancelAtPeriodEnd = model.getCancelAtPeriodEnd();
    entity.trialEndsAt = model.getTrialEndsAt();

    // Address and tax
    const billingAddress = model.getBillingAddress();
    if (billingAddress) {
      entity.billingAddress = {
        addressLine1: billingAddress.addressLine1,
        addressLine2: billingAddress.addressLine2,
        city: billingAddress.city,
        state: billingAddress.state,
        zipcode: billingAddress.zipcode,
        country: billingAddress.country,
      };
    } else {
      entity.billingAddress = null;
    }
    entity.taxRegionId = model.getTaxRegionId();
    entity.metadata = model.getMetadata();
    entity.updatedAt = model.getUpdatedAt();
  }

  // ========================================
  // ✅ EXISTING METHODS (Maintained for compatibility)
  // ========================================

  /**
   * @deprecated Use findByIdAsDomain for new code (Domain Model pattern)
   */

  async findOneByUserId(userId: string): Promise<Subscription | null> {
    return this.findOne({
      where: {
        userId,
      },
    });
  }
}
