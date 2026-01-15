# Fase 5: Migração Gradual

**Duração**: 1 semana  
**Objetivo**: Migrar outros métodos, deprecar Transaction Script e estabilizar  
**Status**: ⏳ Pendente

---

## 🎯 Objetivos

1. Marcar Transaction Script como `@deprecated`
2. Migrar 3-4 métodos adicionais para Use Cases
3. Atualizar Controllers para usar Use Cases exclusivamente
4. Remover feature flags
5. Documentar padrão para o resto do time

---

## 📋 Pré-requisitos

- [ ] Fase 4 completa e validada
- [ ] Domain Events funcionando
- [ ] Use Case `changePlan` estável em produção

---

## 🔧 Implementação

### Passo 1: Deprecar Transaction Script

```typescript
// src/module/billing/subscription/core/service/subscription-billing.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';

/**
 * SUBSCRIPTION BILLING SERVICE
 *
 * ⚠️ DEPRECATED - Use Use Cases instead
 *
 * This service will be removed in v3.0.
 *
 * Migration Guide:
 * - changePlanForUser() → ChangePlanUseCase
 * - addAddOn() → AddAddOnUseCase
 * - cancelSubscription() → CancelSubscriptionUseCase
 * - generateMonthlyInvoice() → GenerateMonthlyInvoiceUseCase
 *
 * @deprecated since v2.5 - Use individual Use Cases in core/use-case/
 */
@Injectable()
export class SubscriptionBillingService {
  constructor(
    // ... existing dependencies
    private readonly appLogger: AppLogger,
  ) {}

  /**
   * @deprecated Use ChangePlanUseCase instead
   * This method will be removed in v3.0
   */
  @Transactional({ connectionName: 'billing' })
  async changePlanForUser(
    userId: string,
    subscriptionId: string,
    newPlanId: string,
    options: {
      effectiveDate?: Date;
      chargeImmediately?: boolean;
      keepAddOns?: boolean;
    },
  ): Promise<any> {
    this.appLogger.warn('Using deprecated changePlanForUser', {
      userId,
      subscriptionId,
      message: 'Migrate to ChangePlanUseCase',
      deprecatedSince: 'v2.5',
      removedIn: 'v3.0',
    });

    // ... existing implementation
  }

  /**
   * @deprecated Use AddAddOnUseCase instead
   * This method will be removed in v3.0
   */
  async addAddOn(
    subscriptionId: string,
    addOnId: string,
    options: {
      quantity?: number;
      effectiveDate?: Date;
    },
  ): Promise<any> {
    this.appLogger.warn('Using deprecated addAddOn', {
      subscriptionId,
      addOnId,
      message: 'Migrate to AddAddOnUseCase',
    });

    // ... existing implementation
  }

  // ... outros métodos também marcados como @deprecated
}
```

### Passo 2: Criar Use Cases Adicionais

#### 2.1 Add Add-On Use Case

```typescript
// src/module/billing/subscription/core/use-case/add-add-on.use-case.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { Subscription } from '@billingModule/subscription/core/model/subscription.model';
import { SubscriptionRepository } from '@billingModule/subscription/persistence/repository/subscription.repository';
import { AddOnRepository } from '@billingModule/subscription/persistence/repository/add-on.repository';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';

export interface AddAddOnCommand {
  subscriptionId: string;
  userId: string;
  addOnId: string;
  quantity?: number;
  effectiveDate?: Date;
}

export interface AddAddOnResult {
  subscriptionId: string;
  addOnId: string;
  quantity: number;
  prorationCharge: number;
}

@Injectable()
export class AddAddOnUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly addOnRepository: AddOnRepository,
    private readonly logger: AppLogger,
  ) {}

  @Transactional({ connectionName: 'billing' })
  async execute(command: AddAddOnCommand): Promise<AddAddOnResult> {
    // Load subscription
    const subscription =
      await this.subscriptionRepository.findByIdAndUserIdAsDomain(
        command.subscriptionId,
        command.userId,
      );

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Load add-on
    const addOn = await this.addOnRepository.findById(command.addOnId);
    if (!addOn) {
      throw new NotFoundException('Add-on not found');
    }

    // ✅ Domain Logic
    subscription.addAddOn(command.addOnId, command.quantity || 1);

    // Save
    await this.subscriptionRepository.saveDomain(subscription);

    // Log
    this.logger.log('Add-on added to subscription', {
      subscriptionId: subscription.getId(),
      addOnId: command.addOnId,
      quantity: command.quantity || 1,
    });

    return {
      subscriptionId: subscription.getId(),
      addOnId: command.addOnId,
      quantity: command.quantity || 1,
      prorationCharge: 0, // TODO: Calculate proration
    };
  }
}
```

#### 2.2 Cancel Subscription Use Case

```typescript
// src/module/billing/subscription/core/use-case/cancel-subscription.use-case.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { Subscription } from '@billingModule/subscription/core/model/subscription.model';
import { SubscriptionRepository } from '@billingModule/subscription/persistence/repository/subscription.repository';
import { Inject } from '@nestjs/common';
import {
  IEventBus,
  EVENT_BUS,
} from '@sharedModule/core/event/event-bus.interface';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';

export interface CancelSubscriptionCommand {
  subscriptionId: string;
  userId: string;
  reason?: string;
  effectiveDate?: Date;
}

export interface CancelSubscriptionResult {
  subscriptionId: string;
  cancelledAt: Date;
  effectiveDate: Date;
}

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    private readonly logger: AppLogger,
  ) {}

  @Transactional({ connectionName: 'billing' })
  async execute(
    command: CancelSubscriptionCommand,
  ): Promise<CancelSubscriptionResult> {
    // Load subscription
    const subscription =
      await this.subscriptionRepository.findByIdAndUserIdAsDomain(
        command.subscriptionId,
        command.userId,
      );

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const effectiveDate = command.effectiveDate || new Date();

    // ✅ Domain Logic
    subscription.cancel(command.reason);

    // Save
    await this.subscriptionRepository.saveDomain(subscription);

    // Publish events
    const events = subscription.getEvents();
    await this.eventBus.publishAll(events);
    subscription.clearEvents();

    // Log
    this.logger.log('Subscription cancelled', {
      subscriptionId: subscription.getId(),
      reason: command.reason,
      effectiveDate,
    });

    return {
      subscriptionId: subscription.getId(),
      cancelledAt: new Date(),
      effectiveDate,
    };
  }
}
```

#### 2.3 Activate Subscription Use Case

```typescript
// src/module/billing/subscription/core/use-case/activate-subscription.use-case.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Transactional } from 'typeorm-transactional';
import { Subscription } from '@billingModule/subscription/core/model/subscription.model';
import { SubscriptionRepository } from '@billingModule/subscription/persistence/repository/subscription.repository';
import { Inject } from '@nestjs/common';
import {
  IEventBus,
  EVENT_BUS,
} from '@sharedModule/core/event/event-bus.interface';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';

export interface ActivateSubscriptionCommand {
  subscriptionId: string;
  userId: string;
}

export interface ActivateSubscriptionResult {
  subscriptionId: string;
  activatedAt: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
}

@Injectable()
export class ActivateSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    private readonly logger: AppLogger,
  ) {}

  @Transactional({ connectionName: 'billing' })
  async execute(
    command: ActivateSubscriptionCommand,
  ): Promise<ActivateSubscriptionResult> {
    // Load subscription
    const subscription =
      await this.subscriptionRepository.findByIdAndUserIdAsDomain(
        command.subscriptionId,
        command.userId,
      );

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // ✅ Domain Logic
    subscription.activate();

    // Save
    await this.subscriptionRepository.saveDomain(subscription);

    // Publish events
    const events = subscription.getEvents();
    await this.eventBus.publishAll(events);
    subscription.clearEvents();

    // Log
    this.logger.log('Subscription activated', {
      subscriptionId: subscription.getId(),
      userId: command.userId,
    });

    return {
      subscriptionId: subscription.getId(),
      activatedAt: new Date(),
      currentPeriodStart: subscription.getCurrentPeriodStart(),
      currentPeriodEnd: subscription.getCurrentPeriodEnd(),
    };
  }
}
```

### Passo 3: Atualizar Domain Model (Novos Behaviors)

```typescript
// src/module/billing/subscription/core/model/subscription.model.ts
// (Implementar métodos que eram stubs)

export class Subscription {
  // ... existing code

  /**
   * ✅ Activate subscription
   */
  activate(): void {
    if (this.status === SubscriptionStatus.Active) {
      throw new DomainError('Subscription is already active');
    }

    this.status = SubscriptionStatus.Active;
    this.updatedAt = new Date();

    // Add event
    this.addEvent(new SubscriptionActivatedEvent(this.id, this.userId));
  }

  /**
   * ✅ Cancel subscription
   */
  cancel(reason?: string): void {
    if (!this.isActive()) {
      throw new DomainError('Can only cancel active subscriptions');
    }

    this.status = SubscriptionStatus.Cancelled;
    this.updatedAt = new Date();

    // Add event
    this.addEvent(
      new SubscriptionCancelledEvent(
        this.id,
        this.userId,
        reason || 'User requested',
      ),
    );
  }

  /**
   * ✅ Add add-on to subscription
   */
  addAddOn(addOnId: string, quantity: number): void {
    if (!this.isActive()) {
      throw new DomainError('Can only add add-ons to active subscriptions');
    }

    if (quantity <= 0) {
      throw new DomainError('Quantity must be positive');
    }

    // Check if already has this add-on
    const existing = this.addOns.find((a: any) => a.addOnId === addOnId);
    if (existing) {
      throw new DomainError('Add-on already present. Use update instead.');
    }

    // Add to collection (will be persisted via mapper)
    // Note: Actual SubscriptionAddOn entity is created by mapper
    this.updatedAt = new Date();

    // Add event
    this.addEvent(new AddOnAddedEvent(this.id, addOnId, quantity));
  }

  /**
   * ✅ Remove add-on from subscription
   */
  removeAddOn(addOnId: string): void {
    if (!this.isActive()) {
      throw new DomainError(
        'Can only remove add-ons from active subscriptions',
      );
    }

    const index = this.addOns.findIndex((a: any) => a.addOnId === addOnId);
    if (index === -1) {
      throw new DomainError('Add-on not found');
    }

    this.addOns.splice(index, 1);
    this.updatedAt = new Date();

    // Add event
    this.addEvent(new AddOnRemovedEvent(this.id, addOnId));
  }
}
```

### Passo 4: Atualizar Controller (Remover Feature Flags)

```typescript
// src/module/billing/subscription/http/rest/controller/subscription.controller.ts

import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChangePlanUseCase } from '@billingModule/subscription/core/use-case/change-plan.use-case';
import { AddAddOnUseCase } from '@billingModule/subscription/core/use-case/add-add-on.use-case';
import { CancelSubscriptionUseCase } from '@billingModule/subscription/core/use-case/cancel-subscription.use-case';
import { ActivateSubscriptionUseCase } from '@billingModule/subscription/core/use-case/activate-subscription.use-case';
import { CurrentUser } from '@sharedModule/auth/decorator/current-user.decorator';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly changePlanUseCase: ChangePlanUseCase,
    private readonly addAddOnUseCase: AddAddOnUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly activateSubscriptionUseCase: ActivateSubscriptionUseCase,
    // ❌ Transaction Script removed - no longer injected
  ) {}

  /**
   * ✅ Clean implementation - no feature flags
   */
  @Post(':id/change-plan')
  @HttpCode(200)
  @ApiOperation({ summary: 'Change subscription plan' })
  async changePlan(
    @Param('id') subscriptionId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ChangePlanRequestDto,
  ): Promise<ChangePlanResponseDto> {
    const result = await this.changePlanUseCase.execute({
      userId: user.id,
      subscriptionId,
      newPlanId: dto.planId,
      effectiveDate: dto.effectiveDate,
      chargeImmediately: dto.chargeImmediately,
      keepAddOns: dto.keepAddOns,
    });

    return ChangePlanResponseDto.fromUseCaseResult(result);
  }

  @Post(':id/add-ons')
  @HttpCode(201)
  @ApiOperation({ summary: 'Add add-on to subscription' })
  async addAddOn(
    @Param('id') subscriptionId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: AddAddOnRequestDto,
  ): Promise<AddAddOnResponseDto> {
    const result = await this.addAddOnUseCase.execute({
      userId: user.id,
      subscriptionId,
      addOnId: dto.addOnId,
      quantity: dto.quantity,
    });

    return AddAddOnResponseDto.from(result);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel subscription' })
  async cancel(
    @Param('id') subscriptionId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CancelSubscriptionRequestDto,
  ): Promise<CancelSubscriptionResponseDto> {
    const result = await this.cancelSubscriptionUseCase.execute({
      userId: user.id,
      subscriptionId,
      reason: dto.reason,
    });

    return CancelSubscriptionResponseDto.from(result);
  }

  @Post(':id/activate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Activate subscription' })
  async activate(
    @Param('id') subscriptionId: string,
    @CurrentUser() user: { id: string },
  ): Promise<ActivateSubscriptionResponseDto> {
    const result = await this.activateSubscriptionUseCase.execute({
      userId: user.id,
      subscriptionId,
    });

    return ActivateSubscriptionResponseDto.from(result);
  }
}
```

### Passo 5: Criar Documentação de Migração

````markdown
# Migration Guide: Transaction Script → Use Cases

## Overview

The billing subscription module has been refactored from Transaction Script pattern
to Rich Domain Model + Use Cases pattern.

## Before (Transaction Script)

```typescript
// ❌ Old way
await subscriptionBillingService.changePlanForUser(
  userId,
  subscriptionId,
  newPlanId,
  options,
);
```
````

## After (Use Case)

```typescript
// ✅ New way
await changePlanUseCase.execute({
  userId,
  subscriptionId,
  newPlanId,
  ...options,
});
```

## Migration Map

| Old Method                 | New Use Case                    | Status         |
| -------------------------- | ------------------------------- | -------------- |
| `changePlanForUser()`      | `ChangePlanUseCase`             | ✅ Complete    |
| `addAddOn()`               | `AddAddOnUseCase`               | ✅ Complete    |
| `cancelSubscription()`     | `CancelSubscriptionUseCase`     | ✅ Complete    |
| `activateSubscription()`   | `ActivateSubscriptionUseCase`   | ✅ Complete    |
| `generateMonthlyInvoice()` | `GenerateMonthlyInvoiceUseCase` | 🚧 In Progress |

## Benefits

1. **Clearer Intent**: Use Cases express business operations explicitly
2. **Better Testing**: Domain logic isolated and testable
3. **Easier Maintenance**: ~30 lines vs ~178 lines per operation
4. **Domain Events**: Built-in observability
5. **Reusability**: Domain Services can be reused

## Timeline

- **v2.5**: Use Cases introduced, Transaction Script deprecated
- **v3.0**: Transaction Script removed (breaking change)

````

---

## ✅ Checklist de Validação

- [ ] Transaction Script marcado como `@deprecated`
- [ ] Warning logs adicionados aos métodos deprecated
- [ ] 3-4 Use Cases adicionais criados
- [ ] Domain Model implementa novos behaviors
- [ ] Controllers atualizados (sem feature flags)
- [ ] Documentação de migração criada
- [ ] Todos os testes E2E passando
- [ ] Logs mostram warnings para código legado
- [ ] Código legado ainda funciona (compatibilidade)

---

## 🧪 Como Testar

```bash
# Testar novos Use Cases
npm run test -- subscription/core/use-case

# Testar E2E de todos os endpoints
npm run test:e2e -- subscription

# Verificar warnings de deprecation nos logs
grep "deprecated" logs/*.log

# Validar que nada usa Transaction Script diretamente
grep -r "SubscriptionBillingService" src/module/billing --exclude-dir=__test__
````

---

## 📊 Resultados Esperados

1. ✅ 4-5 Use Cases implementados
2. ✅ Controllers usando apenas Use Cases
3. ✅ Transaction Script deprecated mas funcionando
4. ✅ Documentação clara de migração
5. ✅ Sem feature flags ou dual support

---

## 📝 Próximos Passos

Após completar esta fase:

1. Monitor logs para uso de métodos deprecated
2. Notificar time sobre deprecation
3. Aguardar 1-2 sprints para estabilizar
4. Avançar para [PHASE-6-CLEANUP.md](./PHASE-6-CLEANUP.md)

---

**Status**: ⏳ Aguardando execução  
**Fase Anterior**: [PHASE-4-DOMAIN-EVENTS.md](./PHASE-4-DOMAIN-EVENTS.md)  
**Próxima Fase**: [PHASE-6-CLEANUP.md](./PHASE-6-CLEANUP.md)
