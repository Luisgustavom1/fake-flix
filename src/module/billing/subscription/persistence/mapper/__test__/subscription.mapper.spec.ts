/**
 * SUBSCRIPTION MAPPER - UNIT TESTS
 *
 * Tests for bidirectional conversion between Domain Model and ORM Entity.
 * Ensures no data is lost in the mapping process.
 */

import { SubscriptionMapper } from '../subscription.mapper';
import { Subscription as SubscriptionModel } from '@billingModule/subscription/core/model/subscription.model';
import { Subscription as SubscriptionEntity } from '@billingModule/subscription/persistence/entity/subscription.entity';
import { SubscriptionStatus } from '@billingModule/subscription/core/enum/subscription-status.enum';

describe('SubscriptionMapper', () => {
  let mapper: SubscriptionMapper;

  beforeEach(() => {
    mapper = new SubscriptionMapper();
  });

  describe('toDomain', () => {
    it('should convert entity to domain model with all fields', () => {
      const entity = new SubscriptionEntity();
      entity.id = 'sub-123';
      entity.userId = 'user-456';
      entity.planId = 'plan-basic';
      entity.status = SubscriptionStatus.Active;
      entity.startDate = new Date('2026-01-01');
      entity.endDate = null;
      entity.currentPeriodStart = new Date('2026-01-01');
      entity.currentPeriodEnd = new Date('2026-02-01');
      entity.autoRenew = true;
      entity.canceledAt = null;
      entity.cancelAtPeriodEnd = false;
      entity.trialEndsAt = null;
      entity.billingAddress = {
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4',
        city: 'New York',
        state: 'NY',
        zipcode: '10001',
        country: 'US',
      };
      entity.taxRegionId = 'region-1';
      entity.metadata = { key: 'value' };
      entity.addOns = [];
      entity.discounts = [];
      entity.createdAt = new Date('2026-01-01');
      entity.updatedAt = new Date('2026-01-01');
      entity.deletedAt = null;

      const model = mapper.toDomain(entity);

      expect(model).toBeInstanceOf(SubscriptionModel);
      expect(model.getId()).toBe('sub-123');
      expect(model.getUserId()).toBe('user-456');
      expect(model.getPlanId()).toBe('plan-basic');
      expect(model.getStatus()).toBe(SubscriptionStatus.Active);
      expect(model.getStartDate()).toEqual(new Date('2026-01-01'));
      expect(model.getEndDate()).toBeNull();
      expect(model.getCurrentPeriodStart()).toEqual(new Date('2026-01-01'));
      expect(model.getCurrentPeriodEnd()).toEqual(new Date('2026-02-01'));
      expect(model.getAutoRenew()).toBe(true);
      expect(model.getCanceledAt()).toBeNull();
      expect(model.getCancelAtPeriodEnd()).toBe(false);
      expect(model.getTrialEndsAt()).toBeNull();
      expect(model.getTaxRegionId()).toBe('region-1');
      expect(model.getMetadata()).toEqual({ key: 'value' });
      expect(model.getCreatedAt()).toEqual(new Date('2026-01-01'));
      expect(model.getUpdatedAt()).toEqual(new Date('2026-01-01'));
      expect(model.getDeletedAt()).toBeNull();
    });

    it('should handle billing address with addressLine2', () => {
      const entity = new SubscriptionEntity();
      entity.id = 'sub-123';
      entity.userId = 'user-456';
      entity.planId = 'plan-basic';
      entity.status = SubscriptionStatus.Active;
      entity.startDate = new Date('2026-01-01');
      entity.endDate = null;
      entity.currentPeriodStart = new Date('2026-01-01');
      entity.currentPeriodEnd = new Date('2026-02-01');
      entity.autoRenew = true;
      entity.canceledAt = null;
      entity.cancelAtPeriodEnd = false;
      entity.trialEndsAt = null;
      entity.billingAddress = {
        addressLine1: '123 Main St',
        addressLine2: 'Suite 200',
        city: 'New York',
        state: 'NY',
        zipcode: '10001',
        country: 'US',
      };
      entity.taxRegionId = null;
      entity.metadata = null;
      entity.addOns = [];
      entity.discounts = [];
      entity.createdAt = new Date('2026-01-01');
      entity.updatedAt = new Date('2026-01-01');
      entity.deletedAt = null;

      const model = mapper.toDomain(entity);
      const address = model.getBillingAddress();

      expect(address).toBeDefined();
      expect(address?.addressLine2).toBe('Suite 200');
    });

    it('should handle null billing address', () => {
      const entity = new SubscriptionEntity();
      entity.id = 'sub-123';
      entity.userId = 'user-456';
      entity.planId = 'plan-basic';
      entity.status = SubscriptionStatus.Active;
      entity.startDate = new Date('2026-01-01');
      entity.endDate = null;
      entity.currentPeriodStart = new Date('2026-01-01');
      entity.currentPeriodEnd = new Date('2026-02-01');
      entity.autoRenew = true;
      entity.canceledAt = null;
      entity.cancelAtPeriodEnd = false;
      entity.trialEndsAt = null;
      entity.billingAddress = null;
      entity.taxRegionId = null;
      entity.metadata = null;
      entity.addOns = [];
      entity.discounts = [];
      entity.createdAt = new Date('2026-01-01');
      entity.updatedAt = new Date('2026-01-01');
      entity.deletedAt = null;

      const model = mapper.toDomain(entity);

      expect(model.getBillingAddress()).toBeNull();
    });

    it('should handle undefined relations', () => {
      const entity = new SubscriptionEntity();
      entity.id = 'sub-123';
      entity.userId = 'user-456';
      entity.planId = 'plan-basic';
      entity.status = SubscriptionStatus.Active;
      entity.startDate = new Date('2026-01-01');
      entity.endDate = null;
      entity.currentPeriodStart = new Date('2026-01-01');
      entity.currentPeriodEnd = new Date('2026-02-01');
      entity.autoRenew = true;
      entity.canceledAt = null;
      entity.cancelAtPeriodEnd = false;
      entity.trialEndsAt = null;
      entity.billingAddress = null;
      entity.taxRegionId = null;
      entity.metadata = null;
      // addOns and discounts are undefined (not loaded)
      entity.createdAt = new Date('2026-01-01');
      entity.updatedAt = new Date('2026-01-01');
      entity.deletedAt = null;

      const model = mapper.toDomain(entity);

      expect(model.getAddOns()).toEqual([]);
      expect(model.getDiscounts()).toEqual([]);
    });

    it('should throw error when entity is null', () => {
      expect(() => mapper.toDomain(null as any)).toThrow(
        'Cannot map null entity to domain',
      );
    });

    it('should throw error when entity is undefined', () => {
      expect(() => mapper.toDomain(undefined as any)).toThrow(
        'Cannot map null entity to domain',
      );
    });
  });

  describe('toEntity', () => {
    it('should convert domain model to new entity with all fields', () => {
      const model = SubscriptionModel.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: {
          addressLine1: '123 Main St',
          addressLine2: 'Apt 4',
          city: 'New York',
          state: 'NY',
          zipcode: '10001',
          country: 'US',
        },
        taxRegionId: 'region-1',
        metadata: { key: 'value' },
        addOns: [],
        discounts: [],
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        deletedAt: null,
      });

      const entity = mapper.toEntity(model);

      expect(entity).toBeInstanceOf(SubscriptionEntity);
      expect(entity.id).toBe('sub-123');
      expect(entity.userId).toBe('user-456');
      expect(entity.planId).toBe('plan-basic');
      expect(entity.status).toBe(SubscriptionStatus.Active);
      expect(entity.startDate).toEqual(new Date('2026-01-01'));
      expect(entity.endDate).toBeNull();
      expect(entity.currentPeriodStart).toEqual(new Date('2026-01-01'));
      expect(entity.currentPeriodEnd).toEqual(new Date('2026-02-01'));
      expect(entity.autoRenew).toBe(true);
      expect(entity.canceledAt).toBeNull();
      expect(entity.cancelAtPeriodEnd).toBe(false);
      expect(entity.trialEndsAt).toBeNull();
      expect(entity.billingAddress).toEqual({
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4',
        city: 'New York',
        state: 'NY',
        zipcode: '10001',
        country: 'US',
      });
      expect(entity.taxRegionId).toBe('region-1');
      expect(entity.metadata).toEqual({ key: 'value' });
      expect(entity.createdAt).toEqual(new Date('2026-01-01'));
      expect(entity.updatedAt).toEqual(new Date('2026-01-01'));
      expect(entity.deletedAt).toBeNull();
    });

    it('should handle null billing address', () => {
      const model = SubscriptionModel.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null,
        taxRegionId: null,
        metadata: null,
      });

      const entity = mapper.toEntity(model);

      expect(entity.billingAddress).toBeNull();
    });
  });

  describe('updateEntity', () => {
    it('should update mutable fields only', () => {
      const existingEntity = new SubscriptionEntity();
      existingEntity.id = 'sub-123';
      existingEntity.userId = 'user-456';
      existingEntity.planId = 'plan-basic';
      existingEntity.status = SubscriptionStatus.Active;
      existingEntity.startDate = new Date('2026-01-01');
      existingEntity.endDate = null;
      existingEntity.currentPeriodStart = new Date('2026-01-01');
      existingEntity.currentPeriodEnd = new Date('2026-02-01');
      existingEntity.autoRenew = true;
      existingEntity.canceledAt = null;
      existingEntity.cancelAtPeriodEnd = false;
      existingEntity.trialEndsAt = null;
      existingEntity.billingAddress = null;
      existingEntity.taxRegionId = null;
      existingEntity.metadata = null;
      existingEntity.createdAt = new Date('2026-01-01');
      existingEntity.updatedAt = new Date('2026-01-01');
      existingEntity.deletedAt = null;

      const updatedModel = SubscriptionModel.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-premium', // CHANGED
        status: SubscriptionStatus.Inactive, // CHANGED
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'), // CHANGED
        currentPeriodStart: new Date('2026-02-01'), // CHANGED
        currentPeriodEnd: new Date('2026-03-01'), // CHANGED
        autoRenew: false, // CHANGED
        canceledAt: new Date('2026-01-15'), // CHANGED
        cancelAtPeriodEnd: true, // CHANGED
        trialEndsAt: null,
        billingAddress: {
          addressLine1: '456 New St',
          city: 'Boston',
          state: 'MA',
          zipcode: '02101',
          country: 'US',
        }, // CHANGED
        taxRegionId: 'region-2', // CHANGED
        metadata: { updated: true }, // CHANGED
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-15'), // CHANGED
        deletedAt: null,
      });

      mapper.updateEntity(existingEntity, updatedModel);

      // Mutable fields should be updated
      expect(existingEntity.planId).toBe('plan-premium');
      expect(existingEntity.status).toBe(SubscriptionStatus.Inactive);
      expect(existingEntity.endDate).toEqual(new Date('2026-12-31'));
      expect(existingEntity.currentPeriodStart).toEqual(new Date('2026-02-01'));
      expect(existingEntity.currentPeriodEnd).toEqual(new Date('2026-03-01'));
      expect(existingEntity.autoRenew).toBe(false);
      expect(existingEntity.canceledAt).toEqual(new Date('2026-01-15'));
      expect(existingEntity.cancelAtPeriodEnd).toBe(true);
      expect(existingEntity.billingAddress?.addressLine1).toBe('456 New St');
      expect(existingEntity.taxRegionId).toBe('region-2');
      expect(existingEntity.metadata).toEqual({ updated: true });
      expect(existingEntity.updatedAt).toEqual(new Date('2026-01-15'));

      // Immutable fields should NOT be updated
      expect(existingEntity.id).toBe('sub-123');
      expect(existingEntity.userId).toBe('user-456');
      expect(existingEntity.startDate).toEqual(new Date('2026-01-01'));
      expect(existingEntity.createdAt).toEqual(new Date('2026-01-01'));
    });

    it('should handle clearing billing address', () => {
      const existingEntity = new SubscriptionEntity();
      existingEntity.id = 'sub-123';
      existingEntity.userId = 'user-456';
      existingEntity.planId = 'plan-basic';
      existingEntity.status = SubscriptionStatus.Active;
      existingEntity.startDate = new Date('2026-01-01');
      existingEntity.endDate = null;
      existingEntity.currentPeriodStart = new Date('2026-01-01');
      existingEntity.currentPeriodEnd = new Date('2026-02-01');
      existingEntity.autoRenew = true;
      existingEntity.canceledAt = null;
      existingEntity.cancelAtPeriodEnd = false;
      existingEntity.trialEndsAt = null;
      existingEntity.billingAddress = {
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipcode: '10001',
        country: 'US',
      };
      existingEntity.taxRegionId = null;
      existingEntity.metadata = null;
      existingEntity.createdAt = new Date('2026-01-01');
      existingEntity.updatedAt = new Date('2026-01-01');
      existingEntity.deletedAt = null;

      const updatedModel = SubscriptionModel.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        startDate: new Date('2026-01-01'),
        endDate: null,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        autoRenew: true,
        canceledAt: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        billingAddress: null, // CLEARED
        taxRegionId: null,
        metadata: null,
        updatedAt: new Date('2026-01-15'),
      });

      mapper.updateEntity(existingEntity, updatedModel);

      expect(existingEntity.billingAddress).toBeNull();
    });
  });

  describe('toDomainMany', () => {
    it('should convert multiple entities to domain models', () => {
      const entity1 = new SubscriptionEntity();
      entity1.id = 'sub-1';
      entity1.userId = 'user-1';
      entity1.planId = 'plan-basic';
      entity1.status = SubscriptionStatus.Active;
      entity1.startDate = new Date('2026-01-01');
      entity1.endDate = null;
      entity1.currentPeriodStart = new Date('2026-01-01');
      entity1.currentPeriodEnd = new Date('2026-02-01');
      entity1.autoRenew = true;
      entity1.canceledAt = null;
      entity1.cancelAtPeriodEnd = false;
      entity1.trialEndsAt = null;
      entity1.billingAddress = null;
      entity1.taxRegionId = null;
      entity1.metadata = null;
      entity1.addOns = [];
      entity1.discounts = [];
      entity1.createdAt = new Date('2026-01-01');
      entity1.updatedAt = new Date('2026-01-01');
      entity1.deletedAt = null;

      const entity2 = new SubscriptionEntity();
      entity2.id = 'sub-2';
      entity2.userId = 'user-2';
      entity2.planId = 'plan-premium';
      entity2.status = SubscriptionStatus.Active;
      entity2.startDate = new Date('2026-01-01');
      entity2.endDate = null;
      entity2.currentPeriodStart = new Date('2026-01-01');
      entity2.currentPeriodEnd = new Date('2026-02-01');
      entity2.autoRenew = true;
      entity2.canceledAt = null;
      entity2.cancelAtPeriodEnd = false;
      entity2.trialEndsAt = null;
      entity2.billingAddress = null;
      entity2.taxRegionId = null;
      entity2.metadata = null;
      entity2.addOns = [];
      entity2.discounts = [];
      entity2.createdAt = new Date('2026-01-01');
      entity2.updatedAt = new Date('2026-01-01');
      entity2.deletedAt = null;

      const models = mapper.toDomainMany([entity1, entity2]);

      expect(models).toHaveLength(2);
      expect(models[0].getId()).toBe('sub-1');
      expect(models[1].getId()).toBe('sub-2');
    });

    it('should handle empty array', () => {
      const models = mapper.toDomainMany([]);

      expect(models).toEqual([]);
    });
  });

  describe('bidirectional conversion integrity', () => {
    it('should preserve all data through round-trip conversion', () => {
      const originalEntity = new SubscriptionEntity();
      originalEntity.id = 'sub-123';
      originalEntity.userId = 'user-456';
      originalEntity.planId = 'plan-basic';
      originalEntity.status = SubscriptionStatus.Active;
      originalEntity.startDate = new Date('2026-01-01T00:00:00Z');
      originalEntity.endDate = null;
      originalEntity.currentPeriodStart = new Date('2026-01-01T00:00:00Z');
      originalEntity.currentPeriodEnd = new Date('2026-02-01T00:00:00Z');
      originalEntity.autoRenew = true;
      originalEntity.canceledAt = null;
      originalEntity.cancelAtPeriodEnd = false;
      originalEntity.trialEndsAt = null;
      originalEntity.billingAddress = {
        addressLine1: '123 Main St',
        addressLine2: 'Suite 100',
        city: 'New York',
        state: 'NY',
        zipcode: '10001',
        country: 'US',
      };
      originalEntity.taxRegionId = 'region-1';
      originalEntity.metadata = { foo: 'bar' };
      originalEntity.addOns = [];
      originalEntity.discounts = [];
      originalEntity.createdAt = new Date('2026-01-01T00:00:00Z');
      originalEntity.updatedAt = new Date('2026-01-01T00:00:00Z');
      originalEntity.deletedAt = null;

      // Entity → Domain → Entity
      const model = mapper.toDomain(originalEntity);
      const newEntity = mapper.toEntity(model);

      // Verify all fields match
      expect(newEntity.id).toBe(originalEntity.id);
      expect(newEntity.userId).toBe(originalEntity.userId);
      expect(newEntity.planId).toBe(originalEntity.planId);
      expect(newEntity.status).toBe(originalEntity.status);
      expect(newEntity.startDate).toEqual(originalEntity.startDate);
      expect(newEntity.endDate).toBe(originalEntity.endDate);
      expect(newEntity.currentPeriodStart).toEqual(
        originalEntity.currentPeriodStart,
      );
      expect(newEntity.currentPeriodEnd).toEqual(
        originalEntity.currentPeriodEnd,
      );
      expect(newEntity.autoRenew).toBe(originalEntity.autoRenew);
      expect(newEntity.canceledAt).toBe(originalEntity.canceledAt);
      expect(newEntity.cancelAtPeriodEnd).toBe(
        originalEntity.cancelAtPeriodEnd,
      );
      expect(newEntity.trialEndsAt).toBe(originalEntity.trialEndsAt);
      expect(newEntity.billingAddress).toEqual(originalEntity.billingAddress);
      expect(newEntity.taxRegionId).toBe(originalEntity.taxRegionId);
      expect(newEntity.metadata).toEqual(originalEntity.metadata);
      expect(newEntity.createdAt).toEqual(originalEntity.createdAt);
      expect(newEntity.updatedAt).toEqual(originalEntity.updatedAt);
      expect(newEntity.deletedAt).toBe(originalEntity.deletedAt);
    });
  });
});
