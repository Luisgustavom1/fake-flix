# Replication Guide: Apply DDD Tactical Patterns to Other Modules

This guide explains how to replicate the DDD refactoring done in the subscription module to other modules in the Fakeflix system.

**Source Module**: `billing/subscription`  
**Pattern**: Transaction Script → Rich Domain Model + Use Cases  
**Duration**: 6-10 weeks per module (depending on complexity)  
**Status**: ✅ Proven approach

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [When to Apply This Pattern](#when-to-apply-this-pattern)
3. [Step-by-Step Process](#step-by-step-process)
4. [Phase-by-Phase Breakdown](#phase-by-phase-breakdown)
5. [Common Patterns](#common-patterns)
6. [Checklist per Module](#checklist-per-module)
7. [Tips and Best Practices](#tips-and-best-practices)
8. [Timeline Estimation](#timeline-estimation)
9. [Success Criteria](#success-criteria)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting the refactoring:

- [ ] Read [TACTICAL-DDD-GUIDELINES.md](../TACTICAL-DDD-GUIDELINES.md)
- [ ] Study [subscription module implementation](../../src/module/billing/subscription/)
- [ ] Review [CHANGE-PLAN-IMPLEMENTATION-ROADMAP.md](./CHANGE-PLAN-IMPLEMENTATION-ROADMAP.md)
- [ ] Understand [all 6 phases](./PHASE-0-PREPARATION.md) of the refactoring process
- [ ] Have team buy-in and dedicated time allocated
- [ ] Establish baseline metrics (performance, test coverage, complexity)

---

## When to Apply This Pattern

### Good Candidates

Apply this pattern to modules that have:

✅ **Complex Business Logic**

- Multiple business rules and validations
- State transitions with invariants
- Calculations requiring domain knowledge

✅ **Anemic Domain Models**

- Entities with only getters/setters
- Business logic scattered in services
- "Data bags" passed between layers

✅ **God Services / Transaction Scripts**

- Services with 200+ lines
- High cyclomatic complexity (>15)
- Multiple responsibilities in one class

✅ **Poor Testability**

- Hard to unit test business logic
- Requires full integration tests for simple cases
- Mock hell in tests

✅ **Frequent Changes**

- Business rules change often
- New features added regularly
- High maintenance cost

### Poor Candidates

❌ **Don't apply** to modules that:

- Are simple CRUD operations with no business logic
- Are stable and rarely change
- Have external API constraints (just proxies)
- Are scheduled for deprecation
- Have no team ownership

---

## Step-by-Step Process

### Overview

The refactoring follows 6 phases:

```
Phase 0: Preparation (1 week)
  ↓
Phase 1: Domain Model (2 weeks)
  ↓
Phase 2: Use Cases (2 weeks)
  ↓
Phase 3: Domain Services (1 week)
  ↓
Phase 4: Domain Events (1 week)
  ↓
Phase 5: Gradual Migration (2 weeks)
  ↓
Phase 6: Cleanup (1 week)
```

**Total**: 6-10 weeks depending on module complexity

---

## Phase-by-Phase Breakdown

### Phase 0: Preparation

**Goal**: Establish baseline and safety net

**Duration**: 1 week

**Tasks**:

1. **Create E2E Tests**

   - Test all critical user flows
   - Capture current behavior (bugs and all)
   - Focus on API contract, not implementation
   - Aim for 80%+ coverage of main flows

2. **Document API Contracts**

   - List all endpoints
   - Document request/response DTOs
   - Note any quirks or edge cases
   - Create OpenAPI specs if possible

3. **Establish Performance Baseline**

   - Measure p50, p95, p99 for key operations
   - Set SLAs for future validation
   - Use tools: k6, Artillery, or custom scripts

4. **Analyze Current Code**
   - Identify God Services / Transaction Scripts
   - Map business logic locations
   - List domain concepts (entities, value objects)
   - Calculate cyclomatic complexity

**Deliverables**:

- [ ] E2E test suite (80%+ coverage)
- [ ] API documentation
- [ ] Performance baseline report
- [ ] Code analysis report
- [ ] `PHASE-0-PREPARATION.md` document

**Success Criteria**: All E2E tests passing, baseline metrics documented

---

### Phase 1: Domain Model

**Goal**: Extract business logic into rich domain models

**Duration**: 2 weeks

**Tasks**:

1. **Identify Aggregate Roots**

   - Find main entities (e.g., `Subscription`, `Invoice`, `Order`)
   - Define aggregate boundaries
   - List related entities within aggregates

2. **Create Domain Models**

   - Create `core/model/` directory
   - Implement rich models with behavior
   - Move business logic from services to models
   - Make constructors private, use factories

3. **Implement Domain Events**

   - Create `core/event/` directory
   - Define immutable event classes
   - Add event collection to models

4. **Create Mappers**

   - Create `persistence/mapper/` directory
   - Implement bidirectional conversion (Domain ↔ ORM)
   - Keep mappers simple and focused

5. **Adapt Repositories**
   - Update repositories to return domain models
   - Use mappers for conversion
   - Keep repository interfaces minimal

**Example Structure**:

```typescript
// core/model/subscription.model.ts
export class Subscription {
  private readonly id: string;
  private planId: string;
  private status: SubscriptionStatus;
  private readonly events: DomainEvent[] = [];

  private constructor(props: SubscriptionProps) {
    this.id = props.id;
    this.planId = props.planId;
    this.status = props.status;
  }

  static reconstitute(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  changePlan(newPlanId: string, effectiveDate: Date): PlanChangeResult {
    this.validateCanChangePlan();

    const oldPlanId = this.planId;
    this.planId = newPlanId;

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

  private validateCanChangePlan(): void {
    if (this.status === SubscriptionStatus.CANCELLED) {
      throw new DomainException(
        'Cannot change plan for cancelled subscription',
      );
    }
  }

  getEvents(): readonly DomainEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events.length = 0;
  }
}
```

**Deliverables**:

- [ ] Domain models in `core/model/`
- [ ] Domain events in `core/event/`
- [ ] Mappers in `persistence/mapper/`
- [ ] Updated repositories
- [ ] Unit tests for domain models
- [ ] `PHASE-1-DOMAIN-MODEL.md` document

**Success Criteria**: All existing tests still passing, domain logic encapsulated

---

### Phase 2: Use Cases

**Goal**: Create application layer with use cases

**Duration**: 2 weeks

**Tasks**:

1. **Identify Use Cases**

   - One use case per business operation
   - Map from current service methods
   - Use Command/Result pattern

2. **Create Use Case Directory**

   - Create `core/use-case/` directory
   - One file per use case

3. **Implement Use Cases**

   - Load aggregates from repositories
   - Execute domain logic on models
   - Save changes
   - Publish domain events
   - Return results
   - Keep use cases ~20-40 lines

4. **Create Feature Flags**

   - Add feature flags for new implementation
   - Support dual execution (old + new)
   - Log results from both paths
   - Compare outputs

5. **Update Controllers (Optional)**
   - Wire up use cases in controllers
   - Keep old service as fallback
   - Use feature flags to switch

**Example Structure**:

```typescript
// core/use-case/change-plan.use-case.ts
@Injectable()
export class ChangePlanUseCase {
  constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly planRepository: PlanRepository,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  @Transactional()
  async execute(command: ChangePlanCommand): Promise<ChangePlanResult> {
    // 1. Load aggregates
    const subscription = await this.subscriptionRepository.findById(
      command.subscriptionId,
    );
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const newPlan = await this.planRepository.findById(command.newPlanId);
    if (!newPlan) {
      throw new NotFoundException('Plan not found');
    }

    // 2. Execute domain logic
    const result = subscription.changePlan(
      newPlan.id,
      command.effectiveDate || new Date(),
    );

    // 3. Save changes
    await this.subscriptionRepository.save(subscription);

    // 4. Publish events
    await this.eventBus.publishAll(subscription.getEvents());
    subscription.clearEvents();

    // 5. Return result
    return {
      subscriptionId: subscription.getId(),
      oldPlanId: result.oldPlanId,
      newPlanId: result.newPlanId,
      effectiveDate: result.effectiveDate,
      nextBillingDate: subscription.getNextBillingDate(),
    };
  }
}
```

**Deliverables**:

- [ ] Use cases in `core/use-case/`
- [ ] Command/Result types
- [ ] Feature flags for switching
- [ ] Integration tests for use cases
- [ ] `PHASE-2-USE-CASE.md` document

**Success Criteria**: Use cases implemented, feature flags working, tests passing

---

### Phase 3: Domain Services

**Goal**: Extract complex calculations to domain services

**Duration**: 1 week

**Tasks**:

1. **Identify Domain Services**

   - Find logic that doesn't belong in one aggregate
   - Calculations that involve multiple concepts
   - Cross-aggregate operations

2. **Create Domain Services**

   - Keep services stateless
   - Make them reusable
   - No infrastructure dependencies
   - Pure business logic

3. **Extract Service Logic**
   - Move complex calculations from models
   - Inject services where needed
   - Keep models focused

**Example Structure**:

```typescript
// core/service/proration-calculator.service.ts
@Injectable()
export class ProrationCalculatorService {
  calculateProrationCredit(
    subscription: Subscription,
    oldPlan: Plan,
    effectiveDate: Date,
  ): ProrationResult {
    const daysRemaining = this.calculateDaysRemaining(
      subscription.getCurrentPeriodEnd(),
      effectiveDate,
    );

    const totalDaysInPeriod = this.calculateDaysInPeriod(
      subscription.getCurrentPeriodStart(),
      subscription.getCurrentPeriodEnd(),
    );

    const creditAmount =
      (oldPlan.getPrice() / totalDaysInPeriod) * daysRemaining;

    return {
      credit: Math.round(creditAmount * 100) / 100,
      daysRemaining,
      totalDaysInPeriod,
    };
  }

  private calculateDaysRemaining(periodEnd: Date, effectiveDate: Date): number {
    return Math.max(
      0,
      Math.ceil(
        (periodEnd.getTime() - effectiveDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
  }

  private calculateDaysInPeriod(periodStart: Date, periodEnd: Date): number {
    return Math.ceil(
      (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
    );
  }
}
```

**Deliverables**:

- [ ] Domain services in `core/service/`
- [ ] Unit tests for services
- [ ] Updated use cases using services
- [ ] `PHASE-3-DOMAIN-SERVICES.md` document

**Success Criteria**: Complex logic extracted, services are stateless and testable

---

### Phase 4: Domain Events

**Goal**: Implement event-driven architecture

**Duration**: 1 week

**Tasks**:

1. **Implement Event Bus**

   - Start with simple in-memory implementation
   - Log all events for observability
   - Can upgrade to message broker later

2. **Publish Events**

   - Publish after successful transactions
   - Clear events after publishing
   - Handle publishing failures

3. **Create Event Handlers**

   - Implement handlers for cross-module concerns
   - Keep handlers idempotent
   - Handle failures gracefully

4. **Add Monitoring**
   - Log event publishing
   - Track event processing times
   - Alert on failures

**Example Structure**:

```typescript
// shared/core/event/simple-event-bus.ts
@Injectable()
export class SimpleEventBus implements IEventBus {
  constructor(@Inject(APP_LOGGER) private readonly logger: IAppLogger) {}

  async publishAll(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  private async publish(event: DomainEvent): Promise<void> {
    this.logger.info('Domain event published', {
      eventType: event.constructor.name,
      payload: event,
    });

    // TODO: Send to message broker (RabbitMQ, Kafka, etc.)
    // For now, just log for observability
  }
}
```

**Deliverables**:

- [ ] Event bus implementation
- [ ] Event publishing in use cases
- [ ] Event handlers (if needed)
- [ ] Monitoring and logging
- [ ] `PHASE-4-DOMAIN-EVENTS.md` document

**Success Criteria**: Events published and logged, observability improved

---

### Phase 5: Gradual Migration

**Goal**: Migrate controllers to use cases

**Duration**: 2 weeks

**Tasks**:

1. **Remove Feature Flags**

   - Switch all controllers to use cases
   - Remove dual-support code
   - Remove old service calls

2. **Migrate Controllers**

   - Update one controller at a time
   - Test thoroughly after each migration
   - Monitor for regressions

3. **Deprecate Old Services**

   - Mark old services as `@deprecated`
   - Add deprecation warnings
   - Document migration path

4. **Update Tests**

   - Migrate tests to new structure
   - Remove tests for deprecated code
   - Ensure coverage maintained

5. **Monitor Production**
   - Deploy to staging first
   - Monitor metrics closely
   - Gradual rollout to production

**Deliverables**:

- [ ] Controllers using use cases
- [ ] Feature flags removed
- [ ] Old services deprecated
- [ ] Tests migrated
- [ ] Production deployment successful
- [ ] `PHASE-5-GRADUAL-MIGRATION.md` document

**Success Criteria**: All controllers migrated, no regressions, metrics stable

---

### Phase 6: Cleanup

**Goal**: Remove deprecated code and finalize

**Duration**: 1 week

**Tasks**:

1. **Validate No Dependencies**

   - Create validation script
   - Scan for remaining usages
   - Confirm zero active usage

2. **Create Backup**

   - Backup deprecated services
   - Store in `backup/phase-6/`
   - Document removal

3. **Remove Deprecated Code**

   - Delete old services
   - Remove from module providers
   - Clean up imports

4. **Update Documentation**

   - Update module README
   - Document new architecture
   - Create usage examples

5. **Final Validation**
   - Run all tests
   - Run performance benchmarks
   - Deploy to production
   - Monitor for 1-2 weeks

**Deliverables**:

- [ ] Validation script
- [ ] Backup created
- [ ] Deprecated code removed
- [ ] Documentation updated
- [ ] Performance benchmarks
- [ ] `PHASE-6-CLEANUP.md` document

**Success Criteria**: Clean codebase, documentation complete, metrics improved

---

## Common Patterns

### Domain Model Template

```typescript
export class YourAggregate {
  private readonly id: string;
  private readonly events: DomainEvent[] = [];

  private constructor(props: YourAggregateProps) {
    this.id = props.id;
    // Initialize other properties
  }

  static reconstitute(props: YourAggregateProps): YourAggregate {
    return new YourAggregate(props);
  }

  yourBehavior(params: BehaviorParams): BehaviorResult {
    // 1. Validate
    this.validateCanPerformBehavior();

    // 2. Execute business logic
    // ... state changes

    // 3. Add domain event
    this.addEvent(new YourBehaviorPerformedEvent({
      aggregateId: this.id,
      // ... event data
    }));

    // 4. Return result
    return { /* result data */ };
  }

  private validateCanPerformBehavior(): void {
    if (/* invalid state */) {
      throw new DomainException('Cannot perform behavior');
    }
  }

  getEvents(): readonly DomainEvent[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events.length = 0;
  }

  // Getters (no setters!)
  getId(): string {
    return this.id;
  }
}
```

### Use Case Template

```typescript
@Injectable()
export class YourUseCase {
  constructor(
    private readonly repository: YourRepository,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  @Transactional()
  async execute(command: YourCommand): Promise<YourResult> {
    // 1. Load aggregates
    const aggregate = await this.repository.findById(command.aggregateId);
    if (!aggregate) {
      throw new NotFoundException('Aggregate not found');
    }

    // 2. Execute domain logic
    const result = aggregate.yourBehavior(command.params);

    // 3. Save changes
    await this.repository.save(aggregate);

    // 4. Publish events
    await this.eventBus.publishAll(aggregate.getEvents());
    aggregate.clearEvents();

    // 5. Return result
    return {
      aggregateId: aggregate.getId(),
      ...result,
    };
  }
}
```

### Mapper Template

```typescript
@Injectable()
export class YourMapper {
  toDomain(entity: YourEntity): YourAggregate {
    return YourAggregate.reconstitute({
      id: entity.id,
      // ... map other properties
    });
  }

  toEntity(model: YourAggregate): YourEntity {
    const entity = new YourEntity();
    entity.id = model.getId();
    // ... map other properties
    return entity;
  }
}
```

### Domain Event Template

```typescript
export class YourBehaviorPerformedEvent extends DomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly data: YourEventData,
  ) {
    super();
  }
}
```

---

## Checklist per Module

Use this checklist for each module you refactor:

### Phase 0: Preparation

- [ ] E2E tests created (80%+ coverage)
- [ ] API documentation complete
- [ ] Performance baseline established
- [ ] Code analysis done
- [ ] Team aligned on approach

### Phase 1: Domain Model

- [ ] Domain models implemented
- [ ] Mappers created
- [ ] Repositories adapted
- [ ] Unit tests passing
- [ ] E2E tests still passing

### Phase 2: Use Cases

- [ ] Use cases implemented
- [ ] Command/Result types defined
- [ ] Feature flags added
- [ ] Integration tests passing
- [ ] Controllers optionally updated

### Phase 3: Domain Services

- [ ] Domain services extracted
- [ ] Services are stateless
- [ ] Unit tests passing
- [ ] Use cases updated

### Phase 4: Domain Events

- [ ] Event bus implemented
- [ ] Events published
- [ ] Event handlers created (if needed)
- [ ] Monitoring added

### Phase 5: Migration

- [ ] Controllers migrated
- [ ] Feature flags removed
- [ ] Old services deprecated
- [ ] Staging deployment successful
- [ ] Production deployment successful

### Phase 6: Cleanup

- [ ] Validation script created
- [ ] Backup created
- [ ] Deprecated code removed
- [ ] Documentation updated
- [ ] Performance benchmarks passing
- [ ] Production stable for 1-2 weeks

---

## Tips and Best Practices

### 1. Start Small

- Pick **one operation** first (like `changePlan`)
- Complete all 6 phases for that one operation
- Learn and refine your approach
- Then scale to other operations

### 2. Maintain Compatibility

- Use feature flags during migration
- Support dual execution (old + new)
- Compare outputs to catch differences
- Gradual rollout to production

### 3. Test Constantly

- Run E2E tests after every phase
- Maintain or improve test coverage
- Test in staging before production
- Monitor metrics closely

### 4. Document Everything

- Keep phase documents updated
- Document decisions and trade-offs
- Create usage examples
- Update README files

### 5. Get Feedback

- Review with team after each phase
- Pair program on complex logic
- Code review all domain models
- Share learnings across teams

### 6. Keep Models Small

- One aggregate root per file
- ~100-200 lines per model max
- Extract to domain services if needed
- Single Responsibility Principle

### 7. Use Types Effectively

- Strong typing for commands and results
- Readonly arrays for event lists
- Interfaces for repository contracts
- Type-safe mappers

### 8. Handle Errors Properly

- Domain exceptions for business rule violations
- Not found exceptions for missing data
- Log all errors with context
- Graceful degradation where possible

### 9. Monitor Performance

- Benchmark before and after
- Set SLAs and validate
- Profile slow operations
- Optimize critical paths

### 10. Celebrate Wins

- Share metrics improvements with team
- Document successes
- Present learnings to wider org
- Use as template for other teams

---

## Timeline Estimation

### Small Module (1-2 services)

- **Complexity**: Low
- **LOC**: <500 lines
- **Timeline**: 2-3 weeks
- **Example**: Simple CRUD with some business rules

**Phase Breakdown**:

- Phase 0: 2 days
- Phase 1: 3 days
- Phase 2: 3 days
- Phase 3: 2 days
- Phase 4: 1 day
- Phase 5: 2 days
- Phase 6: 2 days

### Medium Module (3-5 services)

- **Complexity**: Medium
- **LOC**: 500-1500 lines
- **Timeline**: 4-6 weeks
- **Example**: Subscription module

**Phase Breakdown**:

- Phase 0: 1 week
- Phase 1: 2 weeks
- Phase 2: 2 weeks
- Phase 3: 1 week
- Phase 4: 1 week
- Phase 5: 2 weeks
- Phase 6: 1 week

### Large Module (6+ services)

- **Complexity**: High
- **LOC**: >1500 lines
- **Timeline**: 8-10 weeks
- **Example**: Invoice module with multiple integrations

**Phase Breakdown**:

- Phase 0: 1-2 weeks
- Phase 1: 2-3 weeks
- Phase 2: 2-3 weeks
- Phase 3: 1-2 weeks
- Phase 4: 1-2 weeks
- Phase 5: 2-3 weeks
- Phase 6: 1-2 weeks

---

## Success Criteria

### Code Quality

- [ ] Cyclomatic complexity reduced by 50%+
- [ ] Lines of code per operation reduced by 70%+
- [ ] No code duplication
- [ ] Clear separation of concerns

### Testability

- [ ] Unit tests for domain models
- [ ] Integration tests for use cases
- [ ] E2E tests for critical flows
- [ ] Test coverage maintained or improved (>80%)

### Performance

- [ ] All SLAs met
- [ ] P95 latency maintained or improved
- [ ] No performance regressions
- [ ] Database queries optimized

### Maintainability

- [ ] Code is self-documenting
- [ ] Clear naming conventions
- [ ] Comprehensive documentation
- [ ] Easy to add new features

### Team Alignment

- [ ] Team understands new patterns
- [ ] Code reviews validate approach
- [ ] Knowledge sharing sessions held
- [ ] Documentation complete

---

## Troubleshooting

### Problem: Tests Failing After Refactoring

**Symptoms**:

- E2E tests fail
- Integration tests break
- Different outputs between old and new

**Solutions**:

1. Run old and new implementations side by side
2. Compare outputs and log differences
3. Check mapper conversions (Domain ↔ ORM)
4. Validate business logic moved correctly
5. Review transaction boundaries

### Problem: Performance Degradation

**Symptoms**:

- Slower response times
- Higher database load
- Increased memory usage

**Solutions**:

1. Profile before and after
2. Check for N+1 queries
3. Optimize repository queries
4. Consider caching strategies
5. Review transaction boundaries

### Problem: Complex Business Logic

**Symptoms**:

- Domain models getting too large
- Unclear where logic should live
- Violation of Single Responsibility

**Solutions**:

1. Extract to domain services
2. Split into multiple aggregates
3. Use composition over inheritance
4. Consult with domain experts
5. Review DDD tactical patterns

### Problem: Team Resistance

**Symptoms**:

- Pushback on new patterns
- Confusion about architecture
- Inconsistent implementation

**Solutions**:

1. Pair programming sessions
2. Code review together
3. Share success metrics
4. Provide training sessions
5. Start with small wins

### Problem: Integration Issues

**Symptoms**:

- External services breaking
- Event handling failures
- Queue processing errors

**Solutions**:

1. Use feature flags for gradual rollout
2. Implement retry logic
3. Add circuit breakers
4. Monitor external dependencies
5. Have rollback plan ready

---

## Next Steps

After completing a module refactoring:

1. **Document Learnings**

   - What went well
   - What could be improved
   - Metrics and outcomes

2. **Share Knowledge**

   - Present to team
   - Update this guide
   - Create runbooks

3. **Identify Next Module**

   - Prioritize by business value
   - Consider dependencies
   - Check team capacity

4. **Iterate and Improve**
   - Refine process
   - Update templates
   - Improve tooling

---

## Additional Resources

### Internal Documentation

- [Tactical DDD Guidelines](../TACTICAL-DDD-GUIDELINES.md)
- [Architecture Guidelines](../ARCHITECTURE-GUIDELINES.md)
- [Modular Architecture Guidelines](../MODULAR-ARCHITECTURE-GUIDELINES.md)
- [Subscription Module Example](../../src/module/billing/subscription/)

### External Resources

- **Books**:

  - "Implementing Domain-Driven Design" by Vaughn Vernon
  - "Domain-Driven Design Distilled" by Vaughn Vernon
  - "Clean Architecture" by Robert C. Martin

- **Articles**:
  - [Martin Fowler on Anemic Domain Model](https://martinfowler.com/bliki/AnemicDomainModel.html)
  - [Martin Fowler on Domain Events](https://martinfowler.com/eaaDev/DomainEvent.html)

---

## Contact and Support

**Questions?** Reach out to:

- Engineering team lead
- Architecture guild
- #engineering Slack channel

**Issues?** Create a ticket:

- Tag: `architecture`, `refactoring`, `ddd`
- Include: module name, phase, specific issue

---

**Last Updated**: January 22, 2026  
**Version**: 1.0  
**Status**: ✅ Proven Approach  
**Source**: Subscription Module Refactoring
