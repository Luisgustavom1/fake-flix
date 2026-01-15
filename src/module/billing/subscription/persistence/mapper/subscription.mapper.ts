/**
 * SUBSCRIPTION MAPPER
 *
 * Converts between Domain Model and ORM Entity.
 * This is crucial for maintaining separation of concerns.
 *
 * Domain Model (subscription.model.ts):
 * - Rich behavior
 * - Business logic
 * - No ORM decorators
 *
 * ORM Entity (subscription.entity.ts):
 * - TypeORM decorators
 * - Persistence mapping
 * - No business logic
 *
 * This mapper handles all field conversions including nullable fields
 * and relations.
 */

import { Injectable } from '@nestjs/common';
import { Subscription as SubscriptionModel } from '@billingModule/subscription/core/model/subscription.model';
import { Subscription as SubscriptionEntity } from '@billingModule/subscription/persistence/entity/subscription.entity';

@Injectable()
export class SubscriptionMapper {
  /**
   * ORM Entity → Domain Model
   *
   * Use this when loading from database.
   * Converts TypeORM entity to rich domain model.
   *
   * @param entity - TypeORM entity
   * @returns Domain model
   * @throws Error if entity is null/undefined
   */
  toDomain(entity: SubscriptionEntity): SubscriptionModel {
    if (!entity) {
      throw new Error('Cannot map null entity to domain');
    }

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

      // Relations (may be undefined if not loaded)
      addOns: entity.addOns || [],
      discounts: entity.discounts || [],

      // Audit fields
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt,
    });
  }

  /**
   * Domain Model → ORM Entity (New)
   *
   * Use this when creating new subscription.
   * Converts domain model to TypeORM entity for persistence.
   *
   * @param model - Domain model
   * @returns New TypeORM entity
   */
  toEntity(model: SubscriptionModel): SubscriptionEntity {
    const entity = new SubscriptionEntity();

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

    // Note: Relations (addOns, discounts) are NOT set here
    // They should be handled separately by the repository

    return entity;
  }

  /**
   * Update ORM Entity from Domain Model
   *
   * Use this when updating existing entity.
   * Preserves identity and relations, updates mutable fields only.
   *
   * @param entity - Existing TypeORM entity to update
   * @param model - Domain model with updated state
   */
  updateEntity(entity: SubscriptionEntity, model: SubscriptionModel): void {
    // Update mutable fields only

    // Plan (can change)
    entity.planId = model.getPlanId();

    // Status (can change)
    entity.status = model.getStatus();

    // Lifecycle dates
    entity.endDate = model.getEndDate();

    // Billing period (can change)
    entity.currentPeriodStart = model.getCurrentPeriodStart();
    entity.currentPeriodEnd = model.getCurrentPeriodEnd();

    // Auto-renewal (can change)
    entity.autoRenew = model.getAutoRenew();

    // Cancellation (can change)
    entity.canceledAt = model.getCanceledAt();
    entity.cancelAtPeriodEnd = model.getCancelAtPeriodEnd();

    // Trial (can change)
    entity.trialEndsAt = model.getTrialEndsAt();

    // Address and tax (can change)
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

    // Metadata (can change)
    entity.metadata = model.getMetadata();

    // Update timestamp
    entity.updatedAt = model.getUpdatedAt();

    // Note: We don't update:
    // - id (immutable)
    // - userId (immutable)
    // - startDate (immutable)
    // - createdAt (immutable)
    // - deletedAt (handled by soft delete)
    // - Relations (addOns, discounts) - handled separately
  }

  /**
   * Batch conversion - ORM Entities → Domain Models
   *
   * @param entities - Array of TypeORM entities
   * @returns Array of domain models
   */
  toDomainMany(entities: SubscriptionEntity[]): SubscriptionModel[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
