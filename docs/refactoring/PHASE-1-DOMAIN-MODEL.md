# Fase 1: Domain Model (Rich Entity)

**Duração**: 2 semanas  
**Objetivo**: Criar Domain Entity com comportamento, mantendo ORM Entity separada  
**Status**: ⏳ Pendente

---

## 🎯 Objetivos

1. Criar `Subscription` Domain Model com comportamento rico
2. Implementar método `changePlan()` com toda lógica de negócio
3. Criar Mapper para conversão Domain ↔ ORM
4. Adaptar Repository para trabalhar com Domain Model
5. Manter compatibilidade com código existente

---

## 📋 Pré-requisitos

- [ ] Fase 0 completa e validada
- [ ] Todos os testes E2E passando
- [ ] Baseline de performance estabelecido

---

## 🔧 Implementação

### Passo 1: Criar Estrutura de Pastas

```bash
# Criar diretórios para Domain Models
mkdir -p src/module/billing/subscription/core/model
mkdir -p src/module/billing/subscription/persistence/mapper
```

### Passo 2: Criar Tipos e Interfaces de Suporte

```typescript
// src/module/billing/subscription/core/model/subscription.types.ts

export interface SubscriptionProps {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  addOns?: SubscriptionAddOn[];
  billingAddress?: BillingAddress;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProrationResult {
  credit: number;
  charge: number;
  creditBreakdown: ProrationLineItem[];
  chargeBreakdown: ProrationLineItem[];
}

export interface ProrationLineItem {
  description: string;
  amount: number;
  periodStart: Date;
  periodEnd: Date;
  prorationRate: number;
}

export interface AddOnMigrationResult {
  remainingAddOns: SubscriptionAddOn[];
  removed: SubscriptionAddOn[];
  kept: SubscriptionAddOn[];
}

export interface PlanChangeResult {
  oldPlanId: string;
  newPlanId: string;
  prorationCredit: number;
  prorationCharge: number;
  addOnsRemoved: number;
}

export interface BillingAddress {
  addressLine1: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
}

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
```

### Passo 3: Criar Domain Model

```typescript
// src/module/billing/subscription/core/model/subscription.model.ts

import { SubscriptionStatus } from '@billingModule/subscription/core/enum/subscription-status.enum';
import { SubscriptionAddOn } from '@billingModule/subscription/persistence/entity/subscription-add-on.entity';
import {
  SubscriptionProps,
  ProrationResult,
  AddOnMigrationResult,
  PlanChangeResult,
  BillingAddress,
  DomainError,
} from './subscription.types';

/**
 * SUBSCRIPTION DOMAIN MODEL
 *
 * Rich domain entity that encapsulates subscription business logic.
 * This is separate from ORM Entity (subscription.entity.ts) to maintain
 * clear separation between domain and infrastructure concerns.
 *
 * Key Principles:
 * - IDs are simple strings (no Value Objects - pragmatic approach)
 * - Behavior is encapsulated (changePlan, activate, cancel, etc.)
 * - Invariants are protected (validation in methods)
 * - State changes are intentional (no direct setters)
 */
export class Subscription {
  // ⚠️ IDs são strings simples - seguindo padrão do projeto
  private readonly id: string;
  private readonly userId: string;
  private planId: string;
  private status: SubscriptionStatus;
  private currentPeriodStart: Date;
  private currentPeriodEnd: Date;
  private addOns: SubscriptionAddOn[];
  private billingAddress?: BillingAddress;
  private readonly createdAt: Date;
  private updatedAt: Date;

  /**
   * Private constructor - use factory methods to create instances
   */
  private constructor(props: SubscriptionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.planId = props.planId;
    this.status = props.status;
    this.currentPeriodStart = props.currentPeriodStart;
    this.currentPeriodEnd = props.currentPeriodEnd;
    this.addOns = props.addOns || [];
    this.billingAddress = props.billingAddress;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();
  }

  /**
   * Factory method - reconstitute from persistence
   * Use this when loading from database
   */
  static reconstitute(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  /**
   * ✅ RICH BEHAVIOR: Change Plan
   *
   * Encapsulates all business logic for changing subscription plan.
   * This is the core domain operation that was previously scattered
   * across 178 lines in the service.
   *
   * Business Rules:
   * - Cannot change to same plan
   * - Must be active to change
   * - Proration is calculated externally (Domain Service)
   * - Add-ons are migrated based on new plan compatibility
   * - State is updated atomically
   *
   * @param newPlanId - ID of the new plan
   * @param effectiveDate - When the change takes effect
   * @param prorationResult - Pre-calculated proration (from Domain Service)
   * @param addOnMigrationResult - Pre-migrated add-ons (from Domain Service)
   * @returns Structured result with all change details
   */
  changePlan(
    newPlanId: string,
    effectiveDate: Date,
    prorationResult: ProrationResult,
    addOnMigrationResult: AddOnMigrationResult,
  ): PlanChangeResult {
    // ✅ Business Rule: Cannot change to same plan
    if (this.planId === newPlanId) {
      throw new DomainError('Already on this plan');
    }

    // ✅ Business Rule: Must be active
    if (!this.isActive()) {
      throw new DomainError('Cannot change plan of inactive subscription');
    }

    // Store old plan for result
    const oldPlanId = this.planId;

    // ✅ Update internal state
    this.planId = newPlanId;
    this.addOns = addOnMigrationResult.remainingAddOns;
    this.updatedAt = new Date();

    // ✅ Return structured result
    return {
      oldPlanId,
      newPlanId: this.planId,
      prorationCredit: prorationResult.credit,
      prorationCharge: prorationResult.charge,
      addOnsRemoved: addOnMigrationResult.removed.length,
    };
  }

  /**
   * ✅ Business Logic: Check if subscription is active
   */
  isActive(): boolean {
    return this.status === SubscriptionStatus.Active;
  }

  /**
   * ✅ Business Logic: Check if subscription is in trial
   */
  isInTrial(): boolean {
    return this.status === SubscriptionStatus.Trial;
  }

  /**
   * ✅ Business Logic: Check if subscription is cancelled
   */
  isCancelled(): boolean {
    return this.status === SubscriptionStatus.Cancelled;
  }

  /**
   * ✅ Business Logic: Check if current period has ended
   */
  hasCurrentPeriodEnded(): boolean {
    return new Date() > this.currentPeriodEnd;
  }

  /**
   * ✅ Business Logic: Get days remaining in current period
   */
  getDaysRemainingInPeriod(): number {
    const now = new Date();
    const end = this.currentPeriodEnd;
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  // ========================================
  // Getters (Encapsulation)
  // ========================================

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getPlanId(): string {
    return this.planId;
  }

  getStatus(): SubscriptionStatus {
    return this.status;
  }

  getCurrentPeriodStart(): Date {
    return this.currentPeriodStart;
  }

  getCurrentPeriodEnd(): Date {
    return this.currentPeriodEnd;
  }

  getAddOns(): readonly SubscriptionAddOn[] {
    return [...this.addOns];
  }

  getBillingAddress(): BillingAddress | undefined {
    return this.billingAddress ? { ...this.billingAddress } : undefined;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // ========================================
  // Future Domain Behaviors (Stubs)
  // ========================================

  /**
   * TODO: Implement in Phase 5
   */
  activate(): void {
    throw new Error('Not implemented yet');
  }

  /**
   * TODO: Implement in Phase 5
   */
  cancel(reason?: string): void {
    throw new Error('Not implemented yet');
  }

  /**
   * TODO: Implement in Phase 5
   */
  addAddOn(addOnId: string, quantity: number): void {
    throw new Error('Not implemented yet');
  }

  /**
   * TODO: Implement in Phase 5
   */
  removeAddOn(addOnId: string): void {
    throw new Error('Not implemented yet');
  }
}
```

### Passo 4: Criar Mapper (Domain ↔ ORM)

```typescript
// src/module/billing/subscription/persistence/mapper/subscription.mapper.ts

import { Injectable } from '@nestjs/common';
import { Subscription as SubscriptionModel } from '@billingModule/subscription/core/model/subscription.model';
import { Subscription as SubscriptionEntity } from '@billingModule/subscription/persistence/entity/subscription.entity';

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
 */
@Injectable()
export class SubscriptionMapper {
  /**
   * ORM Entity → Domain Model
   *
   * Use this when loading from database
   */
  toDomain(entity: SubscriptionEntity): SubscriptionModel {
    if (!entity) {
      throw new Error('Cannot map null entity to domain');
    }

    return SubscriptionModel.reconstitute({
      id: entity.id,
      userId: entity.userId,
      planId: entity.planId,
      status: entity.status,
      currentPeriodStart: entity.currentPeriodStart,
      currentPeriodEnd: entity.currentPeriodEnd,
      addOns: entity.addOns || [],
      billingAddress: entity.billingAddress
        ? {
            addressLine1: entity.billingAddress.addressLine1,
            city: entity.billingAddress.city,
            state: entity.billingAddress.state,
            zipcode: entity.billingAddress.zipcode,
            country: entity.billingAddress.country,
          }
        : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  /**
   * Domain Model → ORM Entity (New)
   *
   * Use this when creating new subscription
   */
  toEntity(model: SubscriptionModel): SubscriptionEntity {
    const entity = new SubscriptionEntity();

    entity.id = model.getId();
    entity.userId = model.getUserId();
    entity.planId = model.getPlanId();
    entity.status = model.getStatus();
    entity.currentPeriodStart = model.getCurrentPeriodStart();
    entity.currentPeriodEnd = model.getCurrentPeriodEnd();

    const billingAddress = model.getBillingAddress();
    if (billingAddress) {
      entity.billingAddress = {
        addressLine1: billingAddress.addressLine1,
        city: billingAddress.city,
        state: billingAddress.state,
        zipcode: billingAddress.zipcode,
        country: billingAddress.country,
      };
    }

    entity.createdAt = model.getCreatedAt();
    entity.updatedAt = model.getUpdatedAt();

    return entity;
  }

  /**
   * Update ORM Entity from Domain Model
   *
   * Use this when updating existing entity.
   * Preserves identity and relations, updates mutable fields.
   */
  updateEntity(entity: SubscriptionEntity, model: SubscriptionModel): void {
    // Update mutable fields only
    entity.planId = model.getPlanId();
    entity.status = model.getStatus();
    entity.currentPeriodStart = model.getCurrentPeriodStart();
    entity.currentPeriodEnd = model.getCurrentPeriodEnd();

    const billingAddress = model.getBillingAddress();
    if (billingAddress) {
      entity.billingAddress = {
        addressLine1: billingAddress.addressLine1,
        city: billingAddress.city,
        state: billingAddress.state,
        zipcode: billingAddress.zipcode,
        country: billingAddress.country,
      };
    }

    entity.updatedAt = model.getUpdatedAt();

    // Note: We don't update id, userId, createdAt (immutable)
    // Note: addOns are handled separately (relation)
  }

  /**
   * Batch conversion
   */
  toDomainMany(entities: SubscriptionEntity[]): SubscriptionModel[] {
    return entities.map((entity) => this.toDomain(entity));
  }
}
```

### Passo 5: Adaptar Repository

```typescript
// src/module/billing/subscription/persistence/repository/subscription.repository.ts

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Subscription as SubscriptionEntity } from '@billingModule/subscription/persistence/entity/subscription.entity';
import { Subscription as SubscriptionModel } from '@billingModule/subscription/core/model/subscription.model';
import { SubscriptionMapper } from '@billingModule/subscription/persistence/mapper/subscription.mapper';
import { SubscriptionStatus } from '@billingModule/subscription/core/enum/subscription-status.enum';

@Injectable()
export class SubscriptionRepository extends Repository<SubscriptionEntity> {
  constructor(
    @InjectDataSource('billing')
    dataSource: DataSource,
    private readonly mapper: SubscriptionMapper, // 🆕 Inject mapper
  ) {
    super(SubscriptionEntity, dataSource.createEntityManager());
  }

  // ========================================
  // 🆕 NEW METHODS (Domain Model)
  // ========================================

  /**
   * Find subscription by ID and return as Domain Model
   *
   * @param id - Subscription ID
   * @returns Domain Model or null
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

    return entity ? this.mapper.toDomain(entity) : null;
  }

  /**
   * Find active subscription by user ID and return as Domain Model
   *
   * @param userId - User ID
   * @returns Domain Model or null
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

    return entity ? this.mapper.toDomain(entity) : null;
  }

  /**
   * Find subscription by ID and user ID (ownership validation)
   *
   * @param id - Subscription ID
   * @param userId - User ID
   * @returns Domain Model or null
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

    return entity ? this.mapper.toDomain(entity) : null;
  }

  /**
   * Save Domain Model
   *
   * Handles both insert (new) and update (existing) cases.
   *
   * @param model - Domain Model to save
   */
  async saveDomain(model: SubscriptionModel): Promise<void> {
    const entity = await this.findOne({
      where: { id: model.getId() },
    });

    if (entity) {
      // Update existing
      this.mapper.updateEntity(entity, model);
      await this.save(entity);
    } else {
      // Insert new
      const newEntity = this.mapper.toEntity(model);
      await this.save(newEntity);
    }
  }

  // ========================================
  // ✅ EXISTING METHODS (Maintained for compatibility)
  // ========================================

  /**
   * @deprecated Use findByIdAsDomain for new code
   */
  async findOneById(id: string): Promise<SubscriptionEntity | null> {
    return this.findOne({
      where: { id },
      relations: [
        'plan',
        'addOns',
        'addOns.addOn',
        'discounts',
        'discounts.discount',
      ],
    });
  }

  /**
   * @deprecated Use findActiveByUserIdAsDomain for new code
   */
  async findActiveByUserId(userId: string): Promise<SubscriptionEntity | null> {
    return this.findOne({
      where: { userId, status: SubscriptionStatus.Active },
      relations: [
        'plan',
        'addOns',
        'addOns.addOn',
        'discounts',
        'discounts.discount',
      ],
    });
  }

  // ... other existing methods remain unchanged
}
```

### Passo 6: Criar Testes Unitários do Domain Model

```typescript
// src/module/billing/subscription/core/model/__test__/subscription.model.spec.ts

import { Subscription } from '../subscription.model';
import { SubscriptionStatus } from '@billingModule/subscription/core/enum/subscription-status.enum';
import { DomainError } from '../subscription.types';

describe('Subscription Domain Model', () => {
  let subscription: Subscription;

  beforeEach(() => {
    subscription = Subscription.reconstitute({
      id: 'sub-123',
      userId: 'user-456',
      planId: 'plan-basic',
      status: SubscriptionStatus.Active,
      currentPeriodStart: new Date('2026-01-01'),
      currentPeriodEnd: new Date('2026-02-01'),
      addOns: [],
    });
  });

  describe('changePlan', () => {
    it('should successfully change plan', () => {
      // Arrange
      const newPlanId = 'plan-premium';
      const effectiveDate = new Date();
      const prorationResult = {
        credit: 10,
        charge: 20,
        creditBreakdown: [],
        chargeBreakdown: [],
      };
      const addOnMigrationResult = {
        remainingAddOns: [],
        removed: [],
        kept: [],
      };

      // Act
      const result = subscription.changePlan(
        newPlanId,
        effectiveDate,
        prorationResult,
        addOnMigrationResult,
      );

      // Assert
      expect(result.oldPlanId).toBe('plan-basic');
      expect(result.newPlanId).toBe('plan-premium');
      expect(result.prorationCredit).toBe(10);
      expect(result.prorationCharge).toBe(20);
      expect(subscription.getPlanId()).toBe('plan-premium');
    });

    it('should throw error when changing to same plan', () => {
      // Arrange
      const samePlanId = 'plan-basic';
      const effectiveDate = new Date();
      const prorationResult = {
        credit: 0,
        charge: 0,
        creditBreakdown: [],
        chargeBreakdown: [],
      };
      const addOnMigrationResult = {
        remainingAddOns: [],
        removed: [],
        kept: [],
      };

      // Act & Assert
      expect(() =>
        subscription.changePlan(
          samePlanId,
          effectiveDate,
          prorationResult,
          addOnMigrationResult,
        ),
      ).toThrow(DomainError);
      expect(() =>
        subscription.changePlan(
          samePlanId,
          effectiveDate,
          prorationResult,
          addOnMigrationResult,
        ),
      ).toThrow('Already on this plan');
    });

    it('should throw error when subscription is not active', () => {
      // Arrange
      const cancelledSubscription = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Cancelled,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
        addOns: [],
      });

      const newPlanId = 'plan-premium';
      const effectiveDate = new Date();
      const prorationResult = {
        credit: 10,
        charge: 20,
        creditBreakdown: [],
        chargeBreakdown: [],
      };
      const addOnMigrationResult = {
        remainingAddOns: [],
        removed: [],
        kept: [],
      };

      // Act & Assert
      expect(() =>
        cancelledSubscription.changePlan(
          newPlanId,
          effectiveDate,
          prorationResult,
          addOnMigrationResult,
        ),
      ).toThrow('Cannot change plan of inactive subscription');
    });

    it('should track removed add-ons', () => {
      // Arrange
      const newPlanId = 'plan-premium';
      const effectiveDate = new Date();
      const prorationResult = {
        credit: 10,
        charge: 20,
        creditBreakdown: [],
        chargeBreakdown: [],
      };
      const addOnMigrationResult = {
        remainingAddOns: [],
        removed: [{ id: 'addon-1' }, { id: 'addon-2' }] as any,
        kept: [],
      };

      // Act
      const result = subscription.changePlan(
        newPlanId,
        effectiveDate,
        prorationResult,
        addOnMigrationResult,
      );

      // Assert
      expect(result.addOnsRemoved).toBe(2);
    });
  });

  describe('isActive', () => {
    it('should return true for active subscription', () => {
      expect(subscription.isActive()).toBe(true);
    });

    it('should return false for cancelled subscription', () => {
      const cancelled = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Cancelled,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
      });

      expect(cancelled.isActive()).toBe(false);
    });
  });

  describe('getDaysRemainingInPeriod', () => {
    it('should calculate days remaining correctly', () => {
      const now = new Date('2026-01-15');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const sub = Subscription.reconstitute({
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-basic',
        status: SubscriptionStatus.Active,
        currentPeriodStart: new Date('2026-01-01'),
        currentPeriodEnd: new Date('2026-02-01'),
      });

      const days = sub.getDaysRemainingInPeriod();

      expect(days).toBeGreaterThan(0);
      expect(days).toBeLessThanOrEqual(31);

      jest.useRealTimers();
    });
  });

  describe('encapsulation', () => {
    it('should not allow direct modification of internal state', () => {
      // Getters return copies/readonly
      const addOns = subscription.getAddOns();

      // This should not affect internal state
      (addOns as any).push({ id: 'hacked' });

      expect(subscription.getAddOns().length).toBe(0);
    });

    it('should not expose setters for critical fields', () => {
      // These should not exist
      expect((subscription as any).setPlanId).toBeUndefined();
      expect((subscription as any).setStatus).toBeUndefined();
      expect((subscription as any).setUserId).toBeUndefined();
    });
  });
});
```

---

## ✅ Checklist de Validação

- [ ] Domain Model criado em `core/model/subscription.model.ts`
- [ ] Tipos de suporte criados em `subscription.types.ts`
- [ ] Método `changePlan()` implementado com toda lógica
- [ ] Getters encapsulam estado interno (readonly)
- [ ] Sem setters públicos para campos críticos
- [ ] Mapper criado em `persistence/mapper/subscription.mapper.ts`
- [ ] Mapper converte corretamente Domain → ORM
- [ ] Mapper converte corretamente ORM → Domain
- [ ] Repository tem método `findByIdAsDomain()`
- [ ] Repository tem método `saveDomain()`
- [ ] Métodos antigos do repository ainda existem (compatibilidade)
- [ ] Testes unitários do Domain Model (100% cobertura)
- [ ] Testes do Mapper (conversão bidirecional)
- [ ] Todos os testes passando ✅

---

## 🧪 Como Testar

```bash
# Executar testes do Domain Model
npm run test -- subscription/core/model

# Executar testes do Mapper
npm run test -- subscription/persistence/mapper

# Verificar cobertura
npm run test:cov -- subscription/core/model
```

---

## 📊 Resultados Esperados

Ao final desta fase, você deve ter:

1. ✅ Domain Model com comportamento `changePlan()`
2. ✅ Mapper funcionando perfeitamente (Domain ↔ ORM)
3. ✅ Repository adaptado com novos métodos
4. ✅ Compatibilidade mantida (métodos antigos funcionando)
5. ✅ 100% cobertura de testes unitários do Domain Model

---

## ⚠️ Problemas Comuns

### Mapper não preserva relações (addOns, discounts)

**Solução**: Certifique-se de que o Repository carrega relations antes de converter para Domain.

### Testes falhando por estado mutável

**Solução**: Use `Object.freeze()` ou retorne cópias nos getters.

### TypeScript errors sobre tipos incompatíveis

**Solução**: Certifique-se de que os tipos em `subscription.types.ts` correspondem aos tipos das entities.

---

## 📝 Próximos Passos

Após completar esta fase:

1. Revise o Domain Model com o time
2. Valide que todos os testes passam
3. Commit das mudanças
4. Avance para [PHASE-2-USE-CASE.md](./PHASE-2-USE-CASE.md)

---

**Status**: ⏳ Aguardando execução  
**Fase Anterior**: [PHASE-0-PREPARATION.md](./PHASE-0-PREPARATION.md)  
**Próxima Fase**: [PHASE-2-USE-CASE.md](./PHASE-2-USE-CASE.md)
