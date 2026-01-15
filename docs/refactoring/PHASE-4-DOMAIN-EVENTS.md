# Fase 4: Domain Events (Observability)

**Duração**: 1 semana  
**Objetivo**: Adicionar Domain Events para rastreabilidade e desacoplamento  
**Status**: ⏳ Pendente

---

## 🎯 Objetivos

1. Criar infraestrutura de Domain Events
2. Implementar eventos no Domain Model
3. Publicar eventos após transações
4. Preparar base para consistência eventual

---

## 📋 Pré-requisitos

- [ ] Fase 3 completa e validada
- [ ] Invoice Builder funcionando
- [ ] Use Case simplificado

---

## 🔧 Implementação

### Passo 1: Criar Interface de Domain Event

```typescript
// src/module/shared/core/event/domain-event.interface.ts

/**
 * Base interface for all domain events
 */
export interface DomainEvent {
  /**
   * Unique event identifier
   */
  readonly eventId: string;

  /**
   * When the event occurred
   */
  readonly occurredOn: Date;

  /**
   * ID of the aggregate that generated the event
   */
  readonly aggregateId: string;

  /**
   * Type of event (for routing/filtering)
   */
  readonly eventType: string;

  /**
   * Optional event version (for evolution)
   */
  readonly eventVersion?: number;
}
```

### Passo 2: Criar Eventos Específicos

```typescript
// src/module/billing/subscription/core/event/subscription-plan-changed.event.ts

import { DomainEvent } from '@sharedModule/core/event/domain-event.interface';
import { randomUUID } from 'crypto';

/**
 * Domain Event: Subscription Plan Changed
 *
 * Published when a subscription successfully changes to a new plan.
 *
 * Consumers of this event might:
 * - Update analytics dashboards
 * - Send notification emails
 * - Update recommendation engines
 * - Trigger external integrations
 */
export class SubscriptionPlanChangedEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType = 'SubscriptionPlanChanged';
  readonly eventVersion = 1;

  constructor(
    readonly aggregateId: string, // subscriptionId
    readonly userId: string,
    readonly oldPlanId: string,
    readonly newPlanId: string,
    readonly prorationCredit: number,
    readonly prorationCharge: number,
    readonly addOnsRemoved: number,
    readonly effectiveDate: Date,
  ) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
  }

  /**
   * Serialize to JSON for message broker
   */
  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      payload: {
        userId: this.userId,
        oldPlanId: this.oldPlanId,
        newPlanId: this.newPlanId,
        prorationCredit: this.prorationCredit,
        prorationCharge: this.prorationCharge,
        addOnsRemoved: this.addOnsRemoved,
        effectiveDate: this.effectiveDate.toISOString(),
      },
    };
  }
}
```

```typescript
// src/module/billing/subscription/core/event/add-ons-removed.event.ts

import { DomainEvent } from '@sharedModule/core/event/domain-event.interface';
import { randomUUID } from 'crypto';

export class AddOnsRemovedEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType = 'AddOnsRemoved';
  readonly eventVersion = 1;

  constructor(
    readonly aggregateId: string, // subscriptionId
    readonly removedAddOnIds: string[],
    readonly reason: string,
  ) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
  }

  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      payload: {
        removedAddOnIds: this.removedAddOnIds,
        reason: this.reason,
      },
    };
  }
}
```

### Passo 3: Adicionar Event Collection ao Domain Model

```typescript
// src/module/billing/subscription/core/model/subscription.model.ts
// (Adicionar ao modelo existente)

import { DomainEvent } from '@sharedModule/core/event/domain-event.interface';
import { SubscriptionPlanChangedEvent } from '../event/subscription-plan-changed.event';
import { AddOnsRemovedEvent } from '../event/add-ons-removed.event';

export class Subscription {
  // ... campos existentes

  private readonly events: DomainEvent[] = [];

  // ... construtor existente

  /**
   * Change plan with event generation
   */
  changePlan(
    newPlanId: string,
    effectiveDate: Date,
    prorationResult: ProrationResult,
    addOnMigrationResult: AddOnMigrationResult,
  ): PlanChangeResult {
    // Existing validation and logic...
    if (this.planId === newPlanId) {
      throw new DomainError('Already on this plan');
    }

    if (!this.isActive()) {
      throw new DomainError('Cannot change plan of inactive subscription');
    }

    const oldPlanId = this.planId;

    // Update state
    this.planId = newPlanId;
    this.addOns = addOnMigrationResult.remainingAddOns;
    this.updatedAt = new Date();

    // ✅ Add Domain Event
    this.addEvent(
      new SubscriptionPlanChangedEvent(
        this.id,
        this.userId,
        oldPlanId,
        this.planId,
        prorationResult.credit,
        prorationResult.charge,
        addOnMigrationResult.removed.length,
        effectiveDate,
      ),
    );

    // ✅ Add event for removed add-ons
    if (addOnMigrationResult.removed.length > 0) {
      this.addEvent(
        new AddOnsRemovedEvent(
          this.id,
          addOnMigrationResult.removed.map((a: any) => a.id),
          'Incompatible with new plan',
        ),
      );
    }

    return {
      oldPlanId,
      newPlanId: this.planId,
      prorationCredit: prorationResult.credit,
      prorationCharge: prorationResult.charge,
      addOnsRemoved: addOnMigrationResult.removed.length,
    };
  }

  /**
   * Add domain event to collection
   */
  private addEvent(event: DomainEvent): void {
    this.events.push(event);
  }

  /**
   * Get all collected events
   */
  getEvents(): readonly DomainEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events (after publishing)
   */
  clearEvents(): void {
    this.events.length = 0;
  }
}
```

### Passo 4: Criar Event Bus Interface

```typescript
// src/module/shared/core/event/event-bus.interface.ts

import { DomainEvent } from './domain-event.interface';

/**
 * Event Bus interface for publishing domain events
 *
 * Implementations might:
 * - Log events
 * - Publish to message broker (Kafka, RabbitMQ)
 * - Store in event store
 * - Dispatch to in-process handlers
 */
export interface IEventBus {
  /**
   * Publish single event
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple events
   */
  publishAll(events: DomainEvent[]): Promise<void>;
}

/**
 * DI token for Event Bus
 */
export const EVENT_BUS = Symbol('EVENT_BUS');
```

### Passo 5: Implementar Simple Event Bus (Logs)

```typescript
// src/module/shared/infrastructure/event/simple-event-bus.ts

import { Injectable } from '@nestjs/common';
import { AppLogger } from '@sharedModule/logger/service/app-logger.service';
import { IEventBus } from '@sharedModule/core/event/event-bus.interface';
import { DomainEvent } from '@sharedModule/core/event/domain-event.interface';

/**
 * SIMPLE EVENT BUS
 *
 * Basic implementation that logs events.
 * This is sufficient for Phase 4 - provides observability without complexity.
 *
 * Future: Replace with message broker integration (Kafka/RabbitMQ)
 */
@Injectable()
export class SimpleEventBus implements IEventBus {
  constructor(private readonly logger: AppLogger) {}

  async publish(event: DomainEvent): Promise<void> {
    this.logger.log('Domain Event Published', {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      occurredOn: event.occurredOn,
      payload: (event as any).toJSON?.() || event,
    });

    // TODO: In future, publish to message broker
    // await this.messageBroker.publish(event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }

    this.logger.log('Published batch of domain events', {
      count: events.length,
      types: events.map((e) => e.eventType),
    });
  }
}
```

### Passo 6: Integrar no Use Case

```typescript
// src/module/billing/subscription/core/use-case/change-plan.use-case.ts
// (Adicionar ao construtor e execute)

import { Inject } from '@nestjs/common';
import {
  IEventBus,
  EVENT_BUS,
} from '@sharedModule/core/event/event-bus.interface';

@Injectable()
export class ChangePlanUseCase {
  constructor(
    // ... existing dependencies
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus, // 🆕
  ) {}

  @Transactional({ connectionName: 'billing' })
  async execute(command: ChangePlanCommand): Promise<ChangePlanResult> {
    // ... existing logic

    // 5. Domain Logic (generates events internally)
    const planChangeResult = subscription.changePlan(
      command.newPlanId,
      effectiveDate,
      prorationResult,
      addOnMigrationResult,
    );

    // 6. Save Subscription
    await this.subscriptionRepository.saveDomain(subscription);

    // 7. Build Invoice
    const invoice = await this.invoiceBuilder.buildForPlanChange(
      subscription,
      newPlan,
      prorationResult,
      usageCharges,
      command.chargeImmediately || false,
    );

    // 8. ✅ Publish Domain Events (after successful save)
    const events = subscription.getEvents();
    await this.eventBus.publishAll(events);
    subscription.clearEvents();

    // 9. Log & Return
    this.logger.log('Plan change completed', {
      /* ... */
    });

    return {
      /* ... */
    };
  }
}
```

### Passo 7: Configurar no Module

```typescript
// src/module/shared/shared.module.ts

import { Module, Global } from '@nestjs/common';
import { SimpleEventBus } from './infrastructure/event/simple-event-bus';
import { EVENT_BUS } from './core/event/event-bus.interface';
import { AppLogger } from './logger/service/app-logger.service';

@Global()
@Module({
  providers: [
    AppLogger,
    {
      provide: EVENT_BUS,
      useClass: SimpleEventBus,
    },
  ],
  exports: [EVENT_BUS, AppLogger],
})
export class SharedModule {}
```

### Passo 8: Criar Testes

```typescript
// src/module/billing/subscription/core/model/__test__/subscription.model.spec.ts
// (Adicionar testes de eventos)

describe('Subscription Domain Model - Events', () => {
  it('should collect plan changed event', () => {
    const subscription = Subscription.reconstitute({
      id: 'sub-123',
      userId: 'user-456',
      planId: 'plan-basic',
      status: SubscriptionStatus.Active,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    });

    subscription.changePlan(
      'plan-premium',
      new Date(),
      { credit: 10, charge: 20, creditBreakdown: [], chargeBreakdown: [] },
      { remainingAddOns: [], removed: [], kept: [] },
    );

    const events = subscription.getEvents();

    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('SubscriptionPlanChanged');
    expect((events[0] as any).oldPlanId).toBe('plan-basic');
    expect((events[0] as any).newPlanId).toBe('plan-premium');
  });

  it('should collect add-ons removed event', () => {
    const subscription = Subscription.reconstitute({
      id: 'sub-123',
      userId: 'user-456',
      planId: 'plan-basic',
      status: SubscriptionStatus.Active,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    });

    subscription.changePlan(
      'plan-premium',
      new Date(),
      { credit: 10, charge: 20, creditBreakdown: [], chargeBreakdown: [] },
      {
        remainingAddOns: [],
        removed: [{ id: 'addon-1' }, { id: 'addon-2' }] as any,
        kept: [],
      },
    );

    const events = subscription.getEvents();

    expect(events).toHaveLength(2); // Plan changed + Add-ons removed
    expect(events[1].eventType).toBe('AddOnsRemoved');
  });

  it('should clear events after getting them', () => {
    const subscription = Subscription.reconstitute({
      id: 'sub-123',
      userId: 'user-456',
      planId: 'plan-basic',
      status: SubscriptionStatus.Active,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
    });

    subscription.changePlan(
      'plan-premium',
      new Date(),
      { credit: 10, charge: 20, creditBreakdown: [], chargeBreakdown: [] },
      { remainingAddOns: [], removed: [], kept: [] },
    );

    expect(subscription.getEvents()).toHaveLength(1);

    subscription.clearEvents();

    expect(subscription.getEvents()).toHaveLength(0);
  });
});
```

---

## ✅ Checklist de Validação

- [ ] Interface `DomainEvent` criada
- [ ] Interface `IEventBus` criada
- [ ] `SimpleEventBus` implementado (logs)
- [ ] `SubscriptionPlanChangedEvent` criado
- [ ] `AddOnsRemovedEvent` criado
- [ ] Domain Model coleta eventos em `changePlan()`
- [ ] Use Case publica eventos após save
- [ ] Logs mostram eventos sendo publicados
- [ ] Testes validam coleta e publicação de eventos
- [ ] Todos os testes passando ✅

---

## 🧪 Como Testar

```bash
# Testar Domain Model (eventos)
npm run test -- subscription/core/model

# Testar Use Case (publicação)
npm run test -- subscription/core/use-case

# Testar E2E e verificar logs
npm run test:e2e -- change-plan.spec.ts

# Verificar logs para eventos publicados
grep "Domain Event Published" logs/*.log
```

---

## 📊 Resultados Esperados

1. ✅ Eventos sendo coletados no Domain Model
2. ✅ Eventos sendo publicados após save
3. ✅ Logs mostrando detalhes dos eventos
4. ✅ Base preparada para message broker futuro

---

## 🔮 Próximos Passos (Futuro)

### Integração com Message Broker

```typescript
// Future: Kafka Event Bus
@Injectable()
export class KafkaEventBus implements IEventBus {
  constructor(private readonly kafka: KafkaService) {}

  async publish(event: DomainEvent): Promise<void> {
    await this.kafka.send({
      topic: `domain-events.${event.eventType}`,
      messages: [
        {
          key: event.aggregateId,
          value: JSON.stringify(event),
        },
      ],
    });
  }
}
```

### Event Handlers

```typescript
// Future: Event Handler
@Injectable()
export class OnSubscriptionPlanChanged {
  @EventHandler(SubscriptionPlanChangedEvent)
  async handle(event: SubscriptionPlanChangedEvent): Promise<void> {
    // Send email notification
    // Update analytics
    // Trigger external integrations
  }
}
```

---

## 📝 Próximos Passos Imediatos

Após completar esta fase:

1. Validar eventos nos logs
2. Considerar casos de uso para event handlers
3. Avançar para [PHASE-5-GRADUAL-MIGRATION.md](./PHASE-5-GRADUAL-MIGRATION.md)

---

**Status**: ⏳ Aguardando execução  
**Fase Anterior**: [PHASE-3-INVOICE-BUILDER.md](./PHASE-3-INVOICE-BUILDER.md)  
**Próxima Fase**: [PHASE-5-GRADUAL-MIGRATION.md](./PHASE-5-GRADUAL-MIGRATION.md)
