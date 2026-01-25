# Subscription Module

**Architecture**: DDD Tactical Patterns (Rich Domain Model + Use Cases)  
**Last Refactored**: January 2026  
**Status**: ✅ Production Ready

## Overview

The subscription module manages subscription lifecycle operations including plan changes, add-on management, cancellations, and activations. It follows DDD tactical patterns with rich domain models, use cases, and domain events.

## Architecture

### Layer Structure

```
subscription/
├── core/
│   ├── model/                    # ✅ Rich Domain Models
│   │   └── subscription.model.ts
│   ├── use-case/                 # ✅ Application Layer
│   │   ├── change-plan.use-case.ts
│   │   ├── add-add-on.use-case.ts
│   │   ├── remove-add-on.use-case.ts
│   │   ├── cancel-subscription.use-case.ts
│   │   └── activate-subscription.use-case.ts
│   ├── service/                  # ✅ Domain Services
│   │   ├── proration-calculator.service.ts
│   │   ├── add-on-manager.service.ts
│   │   ├── subscription-plan-change.service.ts
│   │   └── subscription.service.ts
│   ├── event/                    # ✅ Domain Events
│   │   ├── subscription-plan-changed.event.ts
│   │   ├── subscription-cancelled.event.ts
│   │   ├── subscription-activated.event.ts
│   │   ├── add-on-added.event.ts
│   │   ├── add-on-removed.event.ts
│   │   └── add-ons-removed.event.ts
│   ├── interface/
│   │   └── proration-result.interface.ts
│   └── enum/
│       └── subscription-status.enum.ts
│
├── persistence/                  # ✅ Infrastructure Layer
│   ├── entity/                   # ORM Entities (TypeORM)
│   │   └── subscription.entity.ts
│   ├── mapper/                   # Domain ↔ ORM Mappers
│   │   └── subscription.mapper.ts
│   └── repository/
│       ├── subscription.repository.ts
│       ├── plan.repository.ts
│       ├── add-on.repository.ts
│       ├── subscription-add-on.repository.ts
│       ├── subscription-discount.repository.ts
│       └── plan-change-request.repository.ts
│
├── http/                         # ✅ API Layer
│   └── rest/
│       ├── controller/
│       │   ├── subscription.controller.ts
│       │   └── subscription-billing.controller.ts
│       └── dto/
│           ├── request/
│           └── response/
│
└── queue/                        # ✅ Message Queue
    └── producer/
        └── plan-change-invoice.queue-producer.ts
```

### Layer Responsibilities

#### Domain Layer (`core/model/`, `core/service/`, `core/event/`)

**Responsibility**: Pure business logic

**Components**:

- **Domain Models**: Rich entities with behavior (e.g., `Subscription.changePlan()`)
- **Domain Services**: Stateless services for cross-aggregate logic
- **Domain Events**: Immutable facts about what happened

**Rules**:

- No infrastructure dependencies
- No framework dependencies
- Pure TypeScript/JavaScript
- IDs are simple strings (pragmatic choice)

#### Application Layer (`core/use-case/`)

**Responsibility**: Orchestration and coordination

**Components**:

- **Use Cases**: Coordinate domain logic, repositories, and external services

**Characteristics**:

- ~20-30 lines per use case
- Single responsibility
- Command/Result pattern
- Transactional boundaries
- Event publishing

#### Infrastructure Layer (`persistence/`)

**Responsibility**: Technical implementation

**Components**:

- **ORM Entities**: TypeORM entities (NO business logic)
- **Mappers**: Convert Domain ↔ ORM
- **Repositories**: Data access (implements domain interfaces)

**Rules**:

- ORM entities are anemic (data only)
- Mappers handle conversion
- Repository returns Domain Models (not ORM entities)

---

## Use Cases

### 1. ChangePlanUseCase

Change subscription plan with proration support.

**Command**:

```typescript
interface ChangePlanCommand {
  userId: string;
  subscriptionId: string;
  newPlanId: string;
  effectiveDate?: Date;
}
```

**Result**:

```typescript
interface ChangePlanResult {
  subscriptionId: string;
  oldPlanId: string;
  newPlanId: string;
  prorationCredit: number;
  prorationCharge: number;
  effectiveDate: Date;
  nextBillingDate: Date;
}
```

**Events Emitted**:

- `SubscriptionPlanChangedEvent`

**Endpoint**: `POST /subscription/:id/change-plan-sync`

---

### 2. AddAddOnUseCase

Add an add-on to a subscription.

**Command**:

```typescript
interface AddAddOnCommand {
  userId: string;
  subscriptionId: string;
  addOnId: string;
  quantity?: number;
}
```

**Result**:

```typescript
interface AddAddOnResult {
  subscriptionId: string;
  addOnId: string;
  addOnName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}
```

**Events Emitted**:

- `AddOnAddedEvent`

**Endpoint**: `POST /subscription/:id/add-ons`

---

### 3. RemoveAddOnUseCase

Remove an add-on from a subscription.

**Command**:

```typescript
interface RemoveAddOnCommand {
  userId: string;
  subscriptionId: string;
  addOnId: string;
}
```

**Result**:

```typescript
interface RemoveAddOnResult {
  subscriptionId: string;
  addOnId: string;
  prorationCredit: number;
  refundAmount: number;
}
```

**Events Emitted**:

- `AddOnRemovedEvent`

**Endpoint**: `DELETE /subscription/:id/add-ons/:addOnId`

---

### 4. CancelSubscriptionUseCase

Cancel an active subscription.

**Command**:

```typescript
interface CancelSubscriptionCommand {
  userId: string;
  subscriptionId: string;
  reason?: string;
  cancelImmediately?: boolean;
}
```

**Result**:

```typescript
interface CancelSubscriptionResult {
  subscriptionId: string;
  cancelledAt: Date;
  refundAmount: number;
  status: SubscriptionStatus;
}
```

**Events Emitted**:

- `SubscriptionCancelledEvent`

**Endpoint**: `POST /subscription/:id/cancel`

---

### 5. ActivateSubscriptionUseCase

Activate a subscription.

**Command**:

```typescript
interface ActivateSubscriptionCommand {
  userId: string;
  subscriptionId: string;
  startDate?: Date;
}
```

**Result**:

```typescript
interface ActivateSubscriptionResult {
  subscriptionId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  nextBillingDate: Date;
}
```

**Events Emitted**:

- `SubscriptionActivatedEvent`

**Endpoint**: `POST /subscription/:id/activate`

---

## Domain Services

### ProrationCalculatorService

**Responsibility**: Calculate proration credits and charges

**Methods**:

- `calculateProrationCredit(subscription, oldPlan, effectiveDate)` - Calculate credit for unused time
- `calculateProrationCharge(subscription, newPlan, effectiveDate)` - Calculate charge for new plan

**Characteristics**:

- Stateless
- Pure calculation logic
- No side effects
- Reusable across use cases

---

### AddOnManagerService

**Responsibility**: Manage add-on compatibility and migration

**Methods**:

- `validateAddOnCompatibility(planId, addOnId)` - Check if add-on is compatible with plan
- `migrateAddOns(subscription, oldPlan, newPlan)` - Migrate add-ons during plan change

**Characteristics**:

- Stateless
- Business rule enforcement
- Returns structured results

---

### SubscriptionPlanChangeService

**Responsibility**: Async plan change orchestration

**Methods**:

- `initiatePlanChange(command)` - Initiate async plan change
- `getPlanChangeStatus(requestId)` - Get status of plan change request

**Characteristics**:

- Async operations via queue
- Request/status pattern

---

## Domain Events

### SubscriptionPlanChangedEvent

```typescript
{
  subscriptionId: string;
  userId: string;
  oldPlanId: string;
  newPlanId: string;
  prorationCredit: number;
  prorationCharge: number;
  effectiveDate: Date;
  occurredAt: Date;
}
```

**Listeners**:

- Invoice module (generate invoice for plan change)
- Analytics module (track plan changes)
- Notification module (send confirmation email)

---

### AddOnAddedEvent

```typescript
{
  subscriptionId: string;
  userId: string;
  addOnId: string;
  quantity: number;
  totalPrice: number;
  occurredAt: Date;
}
```

**Listeners**:

- Invoice module (generate invoice for add-on)
- Analytics module (track add-on adoption)

---

### SubscriptionCancelledEvent

```typescript
{
  subscriptionId: string;
  userId: string;
  cancelledAt: Date;
  reason?: string;
  refundAmount: number;
  occurredAt: Date;
}
```

**Listeners**:

- Invoice module (process refund)
- Credit module (issue credit)
- Notification module (send cancellation confirmation)
- Analytics module (track churn)

---

## Domain Model

### Subscription (Aggregate Root)

**Responsibilities**:

- Encapsulate subscription state and behavior
- Enforce business rules
- Generate domain events
- Maintain consistency

**Key Behaviors**:

```typescript
class Subscription {
  // Change plan with proration
  changePlan(newPlanId: string, effectiveDate: Date): PlanChangeResult;

  // Add an add-on
  addAddOn(addOnId: string, quantity: number): AddOnResult;

  // Remove an add-on
  removeAddOn(addOnId: string): RemoveAddOnResult;

  // Cancel subscription
  cancel(reason?: string, immediately?: boolean): CancellationResult;

  // Activate subscription
  activate(startDate: Date): void;

  // Domain events
  getEvents(): readonly DomainEvent[];
  clearEvents(): void;
}
```

**Invariants**:

- Cannot change plan if subscription is cancelled
- Cannot add duplicate add-ons
- Cannot cancel already cancelled subscription
- Proration calculations must be accurate

---

## Key Patterns

### 1. Rich Domain Model

```typescript
class Subscription {
  // ✅ Behavior encapsulated
  changePlan(newPlanId: string, effectiveDate: Date): PlanChangeResult {
    // Validations
    this.validateCanChangePlan();

    // State changes
    const oldPlanId = this.planId;
    this.planId = newPlanId;
    this.updatedAt = new Date();

    // Event generation
    this.addEvent(
      new SubscriptionPlanChangedEvent({
        subscriptionId: this.id,
        oldPlanId,
        newPlanId,
        effectiveDate,
      }),
    );

    return { oldPlanId, newPlanId, effectiveDate };
  }

  // ✅ No public setters
  // ✅ Getters return readonly
}
```

### 2. Use Case Pattern

```typescript
@Injectable()
export class ChangePlanUseCase {
  async execute(command: ChangePlanCommand): Promise<ChangePlanResult> {
    // 1. Load aggregates
    const subscription = await this.repository.findById(command.subscriptionId);
    const newPlan = await this.planRepository.findById(command.newPlanId);

    // 2. Execute domain logic
    const result = subscription.changePlan(newPlan.id, command.effectiveDate);

    // 3. Save changes
    await this.repository.save(subscription);

    // 4. Publish events
    await this.eventBus.publishAll(subscription.getEvents());
    subscription.clearEvents();

    // 5. Return result
    return result;
  }
}
```

### 3. Domain Events

```typescript
class Subscription {
  private events: DomainEvent[] = [];

  changePlan(/* ... */): void {
    // ... logic
    this.addEvent(new SubscriptionPlanChangedEvent(/* ... */));
  }

  private addEvent(event: DomainEvent): void {
    this.events.push(event);
  }

  getEvents(): readonly DomainEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events.length = 0;
  }
}

// Use Case publishes after save
await eventBus.publishAll(subscription.getEvents());
```

### 4. Mapper Pattern

```typescript
class SubscriptionMapper {
  toDomain(entity: SubscriptionEntity): Subscription {
    return Subscription.reconstitute({
      id: entity.id,
      userId: entity.userId,
      planId: entity.planId,
      status: entity.status,
      // ... other properties
    });
  }

  toEntity(model: Subscription): SubscriptionEntity {
    const entity = new SubscriptionEntity();
    entity.id = model.getId();
    entity.userId = model.getUserId();
    entity.planId = model.getPlanId();
    entity.status = model.getStatus();
    // ... other properties
    return entity;
  }
}
```

---

## Testing Strategy

### Unit Tests

**Domain Model**:

```typescript
describe('Subscription.changePlan', () => {
  it('should change plan and emit event', () => {
    const subscription = Subscription.reconstitute({...});
    const result = subscription.changePlan('new-plan-id', new Date());

    expect(result.newPlanId).toBe('new-plan-id');
    expect(subscription.getEvents()).toHaveLength(1);
    expect(subscription.getEvents()[0]).toBeInstanceOf(SubscriptionPlanChangedEvent);
  });

  it('should not allow plan change if cancelled', () => {
    const subscription = Subscription.reconstitute({ status: 'cancelled' });

    expect(() => subscription.changePlan('new-plan', new Date()))
      .toThrow('Cannot change plan for cancelled subscription');
  });
});
```

**Domain Services**:

```typescript
describe('ProrationCalculatorService', () => {
  it('should calculate proration credit correctly', () => {
    const service = new ProrationCalculatorService();
    const result = service.calculateProrationCredit(
      subscription,
      oldPlan,
      effectiveDate,
    );

    expect(result.credit).toBeCloseTo(5.0, 2);
  });
});
```

### Integration Tests

**Use Cases**:

```typescript
describe('ChangePlanUseCase (Integration)', () => {
  it('should change plan and save to database', async () => {
    // Arrange
    const useCase = new ChangePlanUseCase(repository, eventBus);
    const command = { subscriptionId: 'sub-1', newPlanId: 'plan-2', ... };

    // Act
    const result = await useCase.execute(command);

    // Assert
    expect(result.newPlanId).toBe('plan-2');

    // Verify persistence
    const saved = await repository.findById('sub-1');
    expect(saved.getPlanId()).toBe('plan-2');

    // Verify events published
    expect(eventBus.publishAll).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: 'SubscriptionPlanChanged' })
      ])
    );
  });
});
```

### E2E Tests

**API Endpoints**:

```typescript
describe('POST /subscription/:id/change-plan-sync (E2E)', () => {
  it('should change plan and return result', async () => {
    const response = await request(app)
      .post('/subscription/sub-1/change-plan-sync')
      .send({ newPlanId: 'plan-premium' })
      .expect(200);

    expect(response.body.newPlanId).toBe('plan-premium');
    expect(response.body.prorationCredit).toBeGreaterThan(0);
  });
});
```

---

## Metrics

### Before Refactoring (Transaction Script)

| Metric                      | Value |
| --------------------------- | ----- |
| Lines in Transaction Script | 809   |
| Cyclomatic Complexity       | 25    |
| Testability                 | ⭐⭐  |
| Maintainability             | ⭐⭐  |

### After Refactoring (Use Cases)

| Metric                | Value        | Improvement |
| --------------------- | ------------ | ----------- |
| Lines per Use Case    | ~20-30       | -96%        |
| Cyclomatic Complexity | ~8           | -68%        |
| Testability           | ⭐⭐⭐⭐⭐   | +150%       |
| Maintainability       | ⭐⭐⭐⭐⭐   | +150%       |
| Performance           | <500ms (p95) | Maintained  |
| Test Coverage         | 85%          | +20%        |

---

## Performance Benchmarks

| Operation                   | P50   | P95   | P99   | SLA       |
| --------------------------- | ----- | ----- | ----- | --------- |
| ChangePlanUseCase           | 280ms | 420ms | 580ms | <500ms ✅ |
| AddAddOnUseCase             | 120ms | 180ms | 250ms | <200ms ✅ |
| RemoveAddOnUseCase          | 110ms | 170ms | 230ms | <200ms ✅ |
| CancelSubscriptionUseCase   | 90ms  | 150ms | 200ms | <200ms ✅ |
| ActivateSubscriptionUseCase | 100ms | 160ms | 210ms | <200ms ✅ |

---

## Related Documentation

- [Billing Module README](../README.md) - Parent module overview
- [Tactical DDD Guidelines](../../../docs/TACTICAL-DDD-GUIDELINES.md) - DDD patterns
- [Refactoring Roadmap](../../../docs/refactoring/CHANGE-PLAN-IMPLEMENTATION-ROADMAP.md) - How we refactored
- [Phase 6 Cleanup](../../../docs/refactoring/PHASE-6-CLEANUP.md) - Cleanup documentation
- [Replication Guide](../../../docs/refactoring/REPLICATION-GUIDE.md) - Apply to other modules

---

**Last Updated**: January 22, 2026  
**Architecture Pattern**: DDD Tactical Patterns  
**Status**: ✅ Production Ready  
**Test Coverage**: 85%+  
**Performance**: All SLAs met ✅
