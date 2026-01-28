# Migration Guide: Transaction Script → Use Cases

## Overview

The billing subscription module has been refactored from **Transaction Script pattern** to **Rich Domain Model + Use Cases pattern** (Tactical DDD).

This guide helps you migrate existing code from the deprecated `SubscriptionBillingService` to the new Use Case architecture.

---

## Why Migrate?

### Problems with Transaction Script

- **Anemic Domain Model**: Business logic scattered in service layer
- **God Service**: 755+ lines, multiple responsibilities
- **Hard to Test**: Complex orchestration with many dependencies
- **Poor Reusability**: Logic tightly coupled to specific use cases
- **No Domain Events**: Manual event emission (often commented out)

### Benefits of Use Cases

1. **Clearer Intent**: Use Cases express business operations explicitly
2. **Better Testing**: Domain logic isolated and testable (~30 lines vs ~178 lines)
3. **Easier Maintenance**: Single responsibility, focused orchestration
4. **Domain Events**: Built-in observability and decoupling
5. **Reusability**: Domain Services can be composed

### Code Reduction

| Operation              | Transaction Script | Use Case  | Reduction              |
| ---------------------- | ------------------ | --------- | ---------------------- |
| `changePlan`           | 178 lines          | ~50 lines | **72%**                |
| `addAddOn`             | 25 lines           | ~30 lines | **-20%** (more robust) |
| `cancelSubscription`   | N/A                | ~25 lines | New feature            |
| `activateSubscription` | N/A                | ~25 lines | New feature            |

---

## Migration Map

| Old Method (Deprecated)            | New Use Case                    | Status      | Notes                      |
| ---------------------------------- | ------------------------------- | ----------- | -------------------------- |
| `changePlanForUser()`              | `ChangePlanUseCase`             | ✅ Complete | Domain events published    |
| `addAddOn()`                       | `AddAddOnUseCase`               | ✅ Complete | Domain validation enforced |
| `removeAddOn()` (via AddOnManager) | `RemoveAddOnUseCase`            | ✅ Complete | Domain-driven              |
| `cancelSubscription()`             | `CancelSubscriptionUseCase`     | ✅ Complete | New in Phase 5             |
| `activateSubscription()`           | `ActivateSubscriptionUseCase`   | ✅ Complete | New in Phase 5             |
| `generateMonthlyInvoice()`         | `GenerateMonthlyInvoiceUseCase` | 🚧 Phase 6  | Deferred (complex)         |

---

## Before & After Examples

### Example 1: Change Subscription Plan

#### ❌ OLD WAY (Transaction Script)

```typescript
// In controller
constructor(
  private readonly subscriptionBillingService: SubscriptionBillingService,
) {}

@Post(':id/change-plan')
async changePlan(
  @Param('id') subscriptionId: string,
  @Body() dto: ChangePlanRequestDto,
) {
  const result = await this.subscriptionBillingService.changePlanForUser(
    userId,
    subscriptionId,
    dto.newPlanId,
    {
      effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
      chargeImmediately: dto.chargeImmediately ?? true,
      keepAddOns: dto.keepAddOns ?? false,
    },
  );

  return ChangePlanResponseDto.fromServiceResult(result);
}
```

**Problems:**

- Direct dependency on Transaction Script
- 178-line method with mixed concerns
- No domain events
- Hard to test in isolation

#### ✅ NEW WAY (Use Case)

```typescript
// In controller
constructor(
  private readonly changePlanUseCase: ChangePlanUseCase,
) {}

@Post(':id/change-plan')
async changePlan(
  @Param('id') subscriptionId: string,
  @Body() dto: ChangePlanRequestDto,
) {
  const result = await this.changePlanUseCase.execute({
    userId,
    subscriptionId,
    newPlanId: dto.newPlanId,
    effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
    chargeImmediately: dto.chargeImmediately ?? true,
    keepAddOns: dto.keepAddOns ?? false,
  });

  return ChangePlanResponseDto.fromUseCaseResult(result);
}
```

**Benefits:**

- Clean command/result pattern
- ~50 lines in Use Case (72% reduction)
- Domain events automatically published
- Business logic in Domain Model: `subscription.changePlan()`
- Easy to test with mocks

---

### Example 2: Add Add-On to Subscription

#### ❌ OLD WAY (Transaction Script)

```typescript
@Post(':id/add-ons')
async addAddOn(
  @Param('id') subscriptionId: string,
  @Body() dto: AddSubscriptionAddOnRequestDto,
) {
  const result = await this.subscriptionBillingService.addAddOn(
    subscriptionId,
    dto.addOnId,
    {
      quantity: dto.quantity ?? 1,
      effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
    },
  );

  return plainToInstance(SubscriptionAddOnResponseDto, {
    id: result.subscriptionAddOn.id,
    addOn: result.subscriptionAddOn.addOn,
    quantity: result.subscriptionAddOn.quantity,
    prorationCharge: result.charge,
    startDate: result.subscriptionAddOn.startDate,
  });
}
```

**Problems:**

- No business rule validation in domain
- No domain events
- ORM entity manipulation

#### ✅ NEW WAY (Use Case)

```typescript
@Post(':id/add-ons')
async addAddOn(
  @Param('id') subscriptionId: string,
  @Body() dto: AddSubscriptionAddOnRequestDto,
) {
  const result = await this.addAddOnUseCase.execute({
    userId,
    subscriptionId,
    addOnId: dto.addOnId,
    quantity: dto.quantity,
  });

  return AddAddOnResponseDto.from(result);
}
```

**Benefits:**

- Domain validation: `subscription.addAddOn()` enforces rules
- `AddOnAddedEvent` published automatically
- Clean DTO transformation
- Business rules protected in domain model

---

### Example 3: Cancel Subscription

#### ❌ OLD WAY (Not Available)

```typescript
// No dedicated method - had to manipulate entities directly
const subscription = await subscriptionRepo.findOne({ where: { id } });
subscription.status = SubscriptionStatus.Inactive;
subscription.canceledAt = new Date();
await subscriptionRepo.save(subscription);

// No events emitted
// No business rule validation
```

**Problems:**

- Anemic domain model
- Business logic in application layer
- No validation (can cancel inactive subscription)
- No observability

#### ✅ NEW WAY (Use Case)

```typescript
@Delete(':id')
async cancelSubscription(
  @Param('id') subscriptionId: string,
  @Body() dto: { reason?: string },
) {
  const result = await this.cancelSubscriptionUseCase.execute({
    userId,
    subscriptionId,
    reason: dto.reason,
  });

  return CancelSubscriptionResponseDto.from(result);
}
```

**Benefits:**

- Domain rules enforced: `subscription.cancel()` validates state
- `SubscriptionCancelledEvent` published for downstream systems
- Reason tracking for analytics
- Clear intent and testability

---

## Domain Model Behaviors

The `Subscription` domain model now includes rich behaviors:

```typescript
// In Subscription domain model
export class Subscription {
  // ✅ Business logic encapsulated
  activate(): void {
    if (this.status === SubscriptionStatus.Active) {
      throw new DomainError('Subscription is already active');
    }
    this.status = SubscriptionStatus.Active;
    this.addEvent(new SubscriptionActivatedEvent(this.id, this.userId));
  }

  cancel(reason?: string): void {
    if (!this.isActive()) {
      throw new DomainError('Can only cancel active subscriptions');
    }
    this.status = SubscriptionStatus.Inactive;
    this.canceledAt = new Date();
    this.addEvent(new SubscriptionCancelledEvent(this.id, this.userId, reason));
  }

  addAddOn(addOnId: string, quantity: number): void {
    if (!this.isActive()) {
      throw new DomainError('Can only add add-ons to active subscriptions');
    }
    if (quantity <= 0) {
      throw new DomainError('Quantity must be positive');
    }
    // Check for duplicates
    const existing = this.addOns.find((a) => a.addOnId === addOnId);
    if (existing) {
      throw new DomainError('Add-on already present');
    }
    this.addEvent(new AddOnAddedEvent(this.id, addOnId, quantity));
  }

  // ... more behaviors
}
```

---

## Use Case Pattern

All Use Cases follow this structure:

```typescript
@Injectable()
export class SomeUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    private readonly logger: AppLogger,
  ) {}

  @Transactional({ connectionName: 'billing' })
  async execute(command: SomeCommand): Promise<SomeResult> {
    // 1. Load domain model
    const subscription = await this.subscriptionRepository
      .findByIdAndUserIdAsDomain(command.subscriptionId, command.userId);

    // 2. Execute domain logic
    subscription.someAction(command.params);

    // 3. Persist changes
    await this.subscriptionRepository.saveDomain(subscription);

    // 4. Publish domain events
    await this.eventBus.publishAll(subscription.getEvents());
    subscription.clearEvents();

    // 5. Log and return
    this.logger.log('Action completed', { subscriptionId: subscription.getId() });
    return { subscriptionId: subscription.getId(), ... };
  }
}
```

**Key Characteristics:**

- **Transactional**: `@Transactional` ensures atomicity
- **Command/Result**: Clear input/output contracts
- **Orchestration Only**: Business logic delegated to domain
- **Event Publishing**: Domain events published after persistence
- **Logging**: Structured logging for observability

---

## Domain Events

| Event                          | Published By    | Consumers                                 |
| ------------------------------ | --------------- | ----------------------------------------- |
| `SubscriptionPlanChangedEvent` | `changePlan()`  | Analytics, Notifications, Recommendations |
| `SubscriptionActivatedEvent`   | `activate()`    | Access Control, Welcome Emails            |
| `SubscriptionCancelledEvent`   | `cancel()`      | Access Revocation, Win-back Campaigns     |
| `AddOnAddedEvent`              | `addAddOn()`    | Feature Access, Billing, Analytics        |
| `AddOnRemovedEvent`            | `removeAddOn()` | Feature Revocation, Refund Processing     |
| `AddOnsRemovedEvent`           | `changePlan()`  | Incompatible add-ons removed              |

---

## Step-by-Step Migration Process

### 1. Update Module (Already Done)

```typescript
// billing.module.ts
providers: [
  // ...
  ChangePlanUseCase,
  AddAddOnUseCase,
  RemoveAddOnUseCase,
  CancelSubscriptionUseCase,
  ActivateSubscriptionUseCase,
  // Keep SubscriptionBillingService for backward compatibility (temporarily)
  SubscriptionBillingService,
],
```

### 2. Update Controller Imports

```typescript
// OLD
import { SubscriptionBillingService } from '@billingModule/subscription/core/service/subscription-billing.service';

// NEW
import { ChangePlanUseCase } from '@billingModule/subscription/core/use-case/change-plan.use-case';
import { AddAddOnUseCase } from '@billingModule/subscription/core/use-case/add-add-on.use-case';
// ... import other use cases
```

### 3. Update Controller Constructor

```typescript
// OLD
constructor(
  private readonly subscriptionBillingService: SubscriptionBillingService,
) {}

// NEW
constructor(
  private readonly changePlanUseCase: ChangePlanUseCase,
  private readonly addAddOnUseCase: AddAddOnUseCase,
  // ... inject other use cases
) {}
```

### 4. Replace Method Calls

```typescript
// OLD
await this.subscriptionBillingService.changePlanForUser(
  userId,
  subscriptionId,
  newPlanId,
  options,
);

// NEW
await this.changePlanUseCase.execute({
  userId,
  subscriptionId,
  newPlanId,
  ...options,
});
```

### 5. Update Tests

```typescript
// OLD
const mockService = {
  changePlanForUser: jest.fn().mockResolvedValue({ ... }),
};

// NEW
const mockUseCase = {
  execute: jest.fn().mockResolvedValue({ ... }),
};
```

---

## Timeline & Deprecation

- **v2.5 (Current)**: Use Cases introduced, Transaction Script deprecated
- **v2.6-v2.9**: Monitoring period, gradual migration
- **v3.0**: Transaction Script removed (breaking change)

---

## FAQs

### Q: Do I need to migrate immediately?

**A:** No. The deprecated `SubscriptionBillingService` will remain functional until v3.0. You'll see warnings in logs to help identify usage.

### Q: What if I have custom logic in Transaction Script?

**A:** Extract domain logic into Domain Model behaviors, or create domain services. Use Cases should only orchestrate.

### Q: Can I use both patterns during migration?

**A:** Yes. Controllers can inject both old and new services temporarily. However, aim to complete migration soon.

### Q: What about `generateMonthlyInvoice()`?

**A:** This will be migrated in Phase 6. It's more complex and may involve separate bounded contexts.

### Q: How do I test Use Cases?

**A:** Use Cases are easier to test:

```typescript
describe('ChangePlanUseCase', () => {
  it('should change plan and publish event', async () => {
    // Mock repository to return domain model
    const subscription = Subscription.create({ ... });
    mockRepo.findByIdAndUserIdAsDomain.mockResolvedValue(subscription);

    // Execute
    const result = await useCase.execute(command);

    // Assert
    expect(subscription.getPlanId()).toBe(newPlanId);
    expect(mockEventBus.publishAll).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ eventType: 'SubscriptionPlanChanged' }),
      ]),
    );
  });
});
```

---

## Additional Resources

- **Architecture Guidelines**: `docs/ARCHITECTURE-GUIDELINES.md`
- **Tactical DDD Guidelines**: `docs/TACTICAL-DDD-GUIDELINES.md`
- **Phase 4 Documentation**: `docs/refactoring/PHASE-4-DOMAIN-EVENTS.md`
- **Phase 5 Documentation**: `docs/refactoring/PHASE-5-GRADUAL-MIGRATION.md`

---

## Support

If you encounter issues during migration:

1. Check deprecation warnings in logs
2. Review this guide and examples
3. Contact the architecture team
4. Open an issue with `[Migration]` tag

---

**Last Updated**: January 2026  
**Version**: v2.5  
**Status**: ✅ Active
