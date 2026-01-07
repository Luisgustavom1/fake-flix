# Fakeflix Architecture Guidelines

> **Purpose**: This document provides comprehensive architectural patterns and guidelines for the Fakeflix project. It serves as a reference for LLMs and developers to understand and maintain consistency with the established architecture.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architectural Philosophy](#architectural-philosophy)
3. [Technology Stack](#technology-stack)
4. [Module Structure](#module-structure)
5. [Naming Conventions](#naming-conventions)
6. [Layer Responsibilities](#layer-responsibilities)
7. [Code Organization Patterns](#code-organization-patterns)
8. [Database Patterns](#database-patterns)
9. [Testing Patterns](#testing-patterns)
10. [Path Aliases](#path-aliases)
11. [Best Practices](#best-practices)

---

## Project Overview

Fakeflix is a **Netflix-like video streaming platform** built with NestJS, following a modular monolith architecture with Domain-Driven Design (DDD) principles. The application is divided into bounded contexts (domains) with clear separation of concerns.

### Core Domains

- **Billing**: Manages subscriptions, plans, and payment processing
- **Content**: Handles video content management (admin, catalog, video processing)
- **Identity**: User authentication and user management
- **Shared**: Cross-cutting concerns and utilities

---

## Architectural Philosophy

### 1. **Modular Monolith with DDD**

- Each domain is a self-contained module with its own persistence layer
- Modules communicate through well-defined interfaces (providers/adapters)
- Clear boundaries prevent tight coupling between domains

### 2. **Hexagonal Architecture (Ports & Adapters)**

- **Core layer** contains business logic, independent of external concerns
- **Adapters** (HTTP clients, persistence) are implementations of core interfaces
- **Ports** (interfaces) define contracts for external dependencies

### 3. **Separation of Concerns**

- Clear separation between:
  - **Business logic** (core layer)
  - **Infrastructure** (persistence, HTTP clients)
  - **Presentation** (REST controllers, GraphQL resolvers)
  - **Integration** (inter-module communication)

### 4. **Use Case Driven Development**

- Complex business operations are encapsulated in **Use Cases**
- Use cases orchestrate services and handle complete business workflows
- Simple CRUD operations can use **Services** directly

### 5. **Explicit Over Implicit**

- DTOs for request/response validation
- Domain models separate from persistence entities
- Clear naming conventions reveal purpose

---

## Technology Stack

### Core Framework

- **NestJS** (v10.x) - Progressive Node.js framework
- **TypeScript** (ES2020 target)
- **TypeORM** (v0.3.x) - ORM with migration support
- **PostgreSQL** - Primary database

### Key Libraries

- **BullMQ** - Job queue for async processing
- **GraphQL** (@nestjs/graphql, @apollo/server) - For Identity module
- **JWT** (@nestjs/jwt) - Authentication
- **class-validator** & **class-transformer** - DTO validation
- **nestjs-cls** - Request context management
- **typeorm-transactional** - Transaction management
- **Winston** (nest-winston) - Structured logging

### Development Tools

- **ESLint** with **eslint-plugin-project-structure** - Enforces folder structure
- **Jest** - Unit and E2E testing
- **Faker** & **Factory.ts** - Test data generation
- **Supertest** - E2E HTTP testing
- **Knex** - Test database utilities
- **Docker Compose** - Local development environment

---

## Module Structure

### Root Structure

```
src/
├── app.module.ts          # Root application module
├── main.ts                # Main application entry point
├── {name}.main.ts         # Additional entry points (workers, etc.)
└── module/                # All domain modules
    ├── billing/           # Billing domain module
    ├── content/           # Content domain module (sub-domains)
    ├── identity/          # Identity domain module
    └── shared/            # Shared utilities and cross-cutting concerns
```

### Domain Module Types

#### 1. **Domain Module** (e.g., billing, identity)

Standard domain module with all layers:

```
{domain}/
├── {domain}.module.ts              # NestJS module definition
├── __test__/                       # Domain-specific tests
│   ├── e2e/                        # End-to-end tests
│   │   ├── {feature}/
│   │   │   └── {feature}.spec.ts
│   │   └── {utility}.{type}.ts
│   └── factory/                    # Test data factories
│       └── {entity}.factory.ts
├── core/                           # Business logic layer
│   ├── enum/
│   │   └── {name}.enum.ts
│   ├── model/                      # Domain models (rich objects)
│   │   └── {name}.model.ts
│   ├── service/                    # Domain services
│   │   └── {name}.service.ts
│   ├── use-case/                   # Complex business operations
│   │   ├── __test__/
│   │   │   └── integration/
│   │   │       └── {name}.use-case.spec.ts
│   │   └── {name}.use-case.ts
│   ├── exception/                  # Domain-specific exceptions
│   │   └── {name}.exception.ts
│   └── adapter/                    # Port interfaces for external dependencies
│       └── {name}.adapter.interface.ts
├── http/                           # HTTP presentation layer
│   ├── rest/                       # REST API
│   │   ├── controller/
│   │   │   └── {resource}.controller.ts
│   │   ├── dto/
│   │   │   ├── request/
│   │   │   │   └── {action}-request.dto.ts
│   │   │   └── response/
│   │   │       └── {resource}-response.dto.ts
│   │   └── interceptor/
│   │       └── {name}.interceptor.ts
│   ├── graphql/                    # GraphQL API (if applicable)
│   │   ├── {resource}.resolver.ts
│   │   └── type/
│   │       └── {name}.type.ts
│   ├── client/                     # External HTTP clients
│   │   └── {service}/
│   │       └── {service}.client.ts
│   └── guard/                      # Route guards
│       └── {name}.guard.ts
├── persistence/                    # Data persistence layer
│   ├── {domain}-persistence.module.ts
│   ├── typeorm-datasource.ts       # TypeORM data source configuration
│   ├── typeorm-datasource.factory.ts
│   ├── entity/
│   │   └── {name}.entity.ts
│   ├── repository/
│   │   └── {name}.repository.ts
│   └── migration/
│       └── {timestamp}-migration.ts
├── integration/                    # Cross-module communication
│   └── provider/
│       └── {domain}-{feature}.provider.ts
└── queue/                          # Async job processing
    ├── queue.constant.ts           # Queue names
    ├── queue.types.ts              # Job payload types
    ├── producer/
    │   └── {job-name}.queue-producer.ts
    └── consumer/
        └── {job-name}.queue-consumer.ts
```

#### 2. **Sub-Domain Module** (e.g., content)

Aggregates multiple related domains:

```
content/
├── content.module.ts               # Aggregator module
├── admin/                          # Content administration (domain module)
├── catalog/                        # Content catalog (domain module)
├── video-processor/                # Video processing (domain module)
└── shared/                         # Content-shared utilities
    └── (follows domain module structure)
```

#### 3. **Shared Module**

Cross-cutting concerns and utilities:

```
shared/
├── core/                           # Core utilities
│   └── model/
│       └── default.model.ts
└── module/                         # Reusable NestJS modules
    ├── auth/                       # Authentication
    ├── config/                     # Configuration management
    ├── http/                       # HTTP utilities
    ├── integration/                # Integration interfaces
    ├── logger/                     # Logging
    └── persistence/                # Persistence utilities
        └── typeorm/
            ├── entity/
            │   └── default.entity.ts
            └── repository/
                └── default-typeorm.repository.ts
```

---

## Naming Conventions

### File Naming

All files **MUST** follow **kebab-case** naming:

| Type               | Pattern                          | Example                                        |
| ------------------ | -------------------------------- | ---------------------------------------------- |
| Module             | `{domain}.module.ts`             | `billing.module.ts`                            |
| Controller         | `{resource}.controller.ts`       | `subscription.controller.ts`                   |
| Service            | `{name}.service.ts`              | `subscription.service.ts`                      |
| Use Case           | `{action}.use-case.ts`           | `create-movie.use-case.ts`                     |
| Repository         | `{entity}.repository.ts`         | `subscription.repository.ts`                   |
| Entity             | `{name}.entity.ts`               | `subscription.entity.ts`                       |
| Model              | `{name}.model.ts`                | `movie-content.model.ts`                       |
| DTO (Request)      | `{action}-request.dto.ts`        | `create-subscription-request.dto.ts`           |
| DTO (Response)     | `{resource}-response.dto.ts`     | `subscription-response.dto.ts`                 |
| Enum               | `{name}.enum.ts`                 | `subscription-status.enum.ts`                  |
| Guard              | `{name}.guard.ts`                | `auth.guard.ts`                                |
| Interceptor        | `{name}.interceptor.ts`          | `rest-response.interceptor.ts`                 |
| Resolver           | `{resource}.resolver.ts`         | `auth.resolver.ts`                             |
| GraphQL Type       | `{name}.type.ts`                 | `auth-token.type.ts`                           |
| HTTP Client        | `{service}.client.ts`            | `external-movie-rating.client.ts`              |
| Provider           | `{domain}-{feature}.provider.ts` | `billing-subscription-status.provider.ts`      |
| Adapter Interface  | `{name}.adapter.interface.ts`    | `video-recommendation.adapter.interface.ts`    |
| Queue Producer     | `{job-name}.queue-producer.ts`   | `video-processing-job.queue-producer.ts`       |
| Queue Consumer     | `{job-name}.queue-consumer.ts`   | `content-age-recommendation.queue-consumer.ts` |
| Factory            | `{entity}.factory.ts`            | `subscription.factory.ts`                      |
| Test (E2E)         | `{feature}.spec.ts`              | `subscription.spec.ts`                         |
| Test (Integration) | `{name}.use-case.spec.ts`        | `create-movie.use-case.spec.ts`                |
| Entry Point        | `{name}.main.ts`                 | `video-processor-worker.main.ts`               |

### Class Naming

Classes **MUST** follow **PascalCase** and include type suffixes:

```typescript
// ✅ Correct
export class SubscriptionController {}
export class CreateMovieUseCase {}
export class SubscriptionService {}
export class SubscriptionRepository {}
export class Subscription {}
export class MovieContentModel {}
export class CreateSubscriptionRequestDto {}
export class SubscriptionResponseDto {}
export enum SubscriptionStatus {}

// ❌ Incorrect
export class subscription {}
export class SubscriptionCtrl {}
export class CreateMovie {}
```

### Variable Naming

- **camelCase** for variables and functions
- **UPPER_SNAKE_CASE** for constants
- Descriptive names over abbreviations

```typescript
// ✅ Correct
const subscriptionService = new SubscriptionService();
const QUEUE_NAME = 'video-processing';
async function createSubscription() {}

// ❌ Incorrect
const sub = new SubscriptionService();
const queuename = 'video-processing';
async function create() {}
```

---

## Layer Responsibilities

### 1. **Core Layer** (`core/`)

**Purpose**: Pure business logic, framework-agnostic

**Components**:

#### **Models** (`model/`)

- Rich domain objects with business logic
- Immutable when possible
- Encapsulate domain rules
- Independent of persistence

```typescript
export class MovieContentModel {
  id: string;
  title: string;
  description: string;
  type: ContentType.MOVIE;
  movie: Movie;
  ageRecommendation: number | null;

  constructor(
    data: Omit<
      WithOptional<
        MovieContentModel,
        'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
      >,
      'type'
    >,
  ) {
    Object.assign(this, {
      ...data,
      id: data.id ? data.id : randomUUID(),
      type: ContentType.MOVIE, // Encapsulates business rule
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
      deletedAt: data.deletedAt,
      movie: data.movie,
    });
  }
}
```

#### **Services** (`service/`)

- Domain-specific business logic
- Coordinate between repositories and models
- Stateless operations
- Used for simpler operations or by use cases

```typescript
@Injectable()
export class SubscriptionService {
  constructor(
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly clsService: ClsService,
  ) {}

  async createSubscription({
    planId,
  }: {
    planId: string;
  }): Promise<Subscription> {
    const plan = await this.planRepository.findOneById(planId);
    if (!plan) {
      throw new NotFoundException(`Plan with id ${planId} not found`);
    }

    const subscription = new Subscription({
      planId,
      userId: this.clsService.get('userId'),
      status: SubscriptionStatus.Active,
      startDate: new Date(),
      autoRenew: true,
    });

    await this.subscriptionRepository.save(subscription);
    return subscription;
  }
}
```

#### **Use Cases** (`use-case/`)

- Orchestrate complex business workflows
- Single responsibility per use case
- May coordinate multiple services
- Handle cross-cutting concerns (logging, events)

```typescript
@Injectable()
export class CreateMovieUseCase {
  constructor(
    private readonly externalMovieRatingClient: ExternalMovieClient,
    private readonly videoProcessorService: VideoProcessorService,
    private readonly contentRepository: ContentRepository,
  ) {}

  async execute(createMovieData: CreateMovieData) {
    // 1. Fetch external data
    const externalRating = await this.externalMovieRatingClient.getRating(
      createMovieData.title,
    );

    // 2. Build domain model
    const content = new MovieContentModel({
      title: createMovieData.title,
      description: createMovieData.description,
      ageRecommendation: null,
      movie: new Movie({
        externalRating,
        video: new Video({
          url: createMovieData.videoUrl,
          sizeInKb: createMovieData.sizeInKb,
        }),
      }),
    });

    // 3. Process thumbnail if provided
    if (createMovieData.thumbnailUrl) {
      content.movie.thumbnail = new Thumbnail({
        url: createMovieData.thumbnailUrl,
      });
    }

    // 4. Trigger async processing
    await this.videoProcessorService.processMetadataAndModeration(
      content.movie.video,
    );

    // 5. Persist
    return await this.contentRepository.saveMovie(content);
  }
}
```

#### **Enums** (`enum/`)

- Domain-specific constants
- Type-safe value objects

```typescript
export enum SubscriptionStatus {
  Active = 'active',
  Inactive = 'inactive',
  Cancelled = 'cancelled',
  Expired = 'expired',
}
```

#### **Adapters** (`adapter/`)

- Define interfaces for external dependencies
- Follow Dependency Inversion Principle
- Implemented outside core layer

```typescript
export interface AgeRecommendationSchema {
  ageRating: number;
  explanation: string;
  categories: string[];
}

export interface VideoAgeRecommendationAdapter {
  getAgeRecommendation(
    videoUrl: string,
  ): Promise<AgeRecommendationSchema | undefined>;
}

export const VideoAgeRecommendationAdapter = Symbol(
  'VideoAgeRecommendationAdapter',
);
```

### 2. **HTTP Layer** (`http/`)

**Purpose**: External communication (REST, GraphQL, HTTP clients)

#### **REST Controllers** (`rest/controller/`)

- Handle HTTP requests/responses
- Delegate to services or use cases
- Transform domain objects to DTOs
- Apply guards and interceptors

```typescript
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createSubscription(
    @Body() createSubscriptionRequest: CreateSubscriptionRequestDto,
  ): Promise<SubscriptionResponseDto> {
    const createdSubscription =
      await this.subscriptionService.createSubscription(
        createSubscriptionRequest,
      );

    return plainToInstance(
      SubscriptionResponseDto,
      { ...createdSubscription, ...{ plan: createdSubscription.plan } },
      { excludeExtraneousValues: true },
    );
  }
}
```

#### **DTOs** (`dto/`)

- **Request DTOs**: Validate incoming data using `class-validator`
- **Response DTOs**: Ensure consistent API contracts using `@Expose()`
- Separate from domain models

```typescript
// Request DTO
export class CreateSubscriptionRequestDto {
  @IsUUID(4)
  @IsNotEmpty()
  readonly planId: string;
}

// Response DTO
export class SubscriptionResponseDto extends DefaultResponseDto {
  @IsUUID(4)
  @Expose()
  @IsNotEmpty()
  readonly userId: string;

  @IsEnum(SubscriptionStatus)
  @Expose()
  @IsNotEmpty()
  readonly status: SubscriptionStatus;

  @IsDateString()
  @Expose()
  @IsNotEmpty()
  readonly startDate: Date;
}
```

#### **GraphQL** (`graphql/`)

- Used in Identity module
- Resolvers handle queries/mutations
- Types define GraphQL schema

```typescript
@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthToken)
  async signIn(
    @Args('SignInInput') signInInput: SignInInput,
  ): Promise<AuthToken> {
    const { email, password } = signInInput;
    const token = await this.authService.signIn(email, password);
    return token;
  }
}

@ObjectType()
export class AuthToken {
  @Field()
  accessToken: string;
}
```

#### **HTTP Clients** (`client/`)

- Integrate with external APIs
- Implement adapter interfaces
- Handle external errors gracefully

```typescript
@Injectable()
export class ExternalMovieClient {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly configService: ConfigService,
  ) {}

  async getRating(title: string): Promise<number | undefined> {
    const keywordId = await this.stringToKeywordId(title);
    if (!keywordId) return;

    const apiResponse = await this.fetch<{ vote_average: number }>(
      `discover/movie?with_keywords=${keywordId}`,
    );

    return apiResponse.results[0]?.vote_average;
  }

  private async fetch<T extends Record<string, any>>(
    path: string,
  ): Promise<ApiResponse<T>> {
    const movieDpApiToken = this.configService.get('movieDb').apiToken;
    const movieDbApiUrl = this.configService.get('movieDb').url;
    const url = `${movieDbApiUrl}/${path}`;
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${movieDpApiToken}`,
      },
    };

    return this.httpClient.get<ApiResponse<T>>(url, options);
  }
}
```

#### **Guards** (`guard/`)

- Implement authorization/authentication
- Applied at controller or handler level
- Works with both REST and GraphQL

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly clsService: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = await this.getRequest(context);
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });

      // Store user context for request
      this.clsService.set('userId', payload.sub);
      this.clsService.set('userToken', token);
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }
}
```

#### **Interceptors** (`interceptor/`)

- Transform responses
- Validate response DTOs
- Add cross-cutting concerns

```typescript
@Injectable()
export class RestResponseInterceptor<T extends object>
  implements NestInterceptor<any, T>
{
  constructor(private readonly dto: new () => T) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<T> {
    return next.handle().pipe(
      switchMap(async (data) => {
        const transformedData = plainToInstance(
          this.dto,
          instanceToPlain(data),
          { excludeExtraneousValues: true },
        );

        const errors = await validate(transformedData);

        if (errors.length) {
          throw new BadRequestException({
            message: 'Response validation failed',
            errors,
          });
        }

        return transformedData;
      }),
    );
  }
}
```

### 3. **Persistence Layer** (`persistence/`)

**Purpose**: Data access and storage

#### **Entities** (`entity/`)

- TypeORM entities (database schema)
- Extend `DefaultEntity` for common fields
- Anemic models (minimal logic)
- Separate from domain models

```typescript
@Entity({ name: 'Subscription' })
export class Subscription extends DefaultEntity<Subscription> {
  @Column()
  userId: string;

  @Column()
  planId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.Inactive,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({ default: true })
  autoRenew: boolean;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'planId' })
  plan: Plan;
}
```

#### **Repositories** (`repository/`)

- Extend `DefaultTypeOrmRepository`
- Domain-specific query methods
- Hide TypeORM details from core layer
- Injected with specific data source

```typescript
@Injectable()
export class SubscriptionRepository extends DefaultTypeOrmRepository<Subscription> {
  constructor(
    @InjectDataSource('billing')
    private readonly dataSource: DataSource,
  ) {
    super(Subscription, dataSource.manager);
  }

  async findOneByUserId(userId: string): Promise<Subscription | null> {
    return this.findOne({
      where: { userId },
    });
  }
}
```

#### **Migrations** (`migration/`)

- Version-controlled schema changes
- Generated via TypeORM CLI
- One migration per logical change

```bash
# Generate migration
pnpm run billing:db:generate

# Run migrations
pnpm run billing:db:migrate
```

#### **Data Source Configuration**

- Each domain has its own TypeORM data source
- Configured in `{domain}-persistence.module.ts`

```typescript
// typeorm-datasource.factory.ts
export const createTypeOrmDataSource = (config: ConfigType) => {
  return new DataSource({
    type: 'postgres',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    entities: [__dirname + '/entity/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migration/*{.ts,.js}'],
    synchronize: false,
  });
};
```

### 4. **Integration Layer** (`integration/`)

**Purpose**: Cross-module communication

#### **Providers** (`provider/`)

- Implement interfaces from `@sharedModule/integration/interface`
- Expose domain capabilities to other modules
- Maintain loose coupling

```typescript
// Interface (in shared module)
export interface BillingSubscriptionApi {
  isUserSubscriptionActive(userId: string): Promise<boolean>;
}

export const BillingSubscriptionApi = Symbol('BillingSubscriptionApi');

// Implementation (in billing module)
@Injectable()
export class BillingSubscriptionProvider implements BillingSubscriptionApi {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async isUserSubscriptionActive(userId: string): Promise<boolean> {
    return await this.subscriptionService.isUserSubscriptionActive(userId);
  }
}
```

### 5. **Queue Layer** (`queue/`)

**Purpose**: Asynchronous job processing with BullMQ

#### **Queue Constants** (`queue.constant.ts`)

```typescript
export const QUEUES = {
  VIDEO_SUMMARY: 'video-summary',
  VIDEO_TRANSCRIPT: 'video-transcript',
  VIDEO_AGE_RECOMMENDATION: 'video-age-recommendation',
  CONTENT_AGE_RECOMMENDATION: 'content-age-recommendation',
};
```

#### **Queue Types** (`queue.types.ts`)

```typescript
export type VideoProcessingJob = {
  videoId: string;
  videoUrl: string;
};
```

#### **Producers** (`producer/`)

- Add jobs to queues
- Log job creation
- Return job IDs

```typescript
@Injectable()
export class VideoProcessingJobProducer {
  constructor(
    @InjectQueue(QUEUES.VIDEO_AGE_RECOMMENDATION)
    private videoRecommendationQueue: Queue,
    private readonly logger: AppLogger,
  ) {}

  async processRecommendation(video: Video) {
    this.logger.log(
      `queueing video recommendation job for video ID: ${video.id}`,
    );

    const job = await this.videoRecommendationQueue.add('process', {
      videoId: video.id,
      videoUrl: video.url,
    });

    this.logger.log(
      `queued video recommendation job with ID: ${job.id} for video ID: ${video.id}`,
    );
    return job.id;
  }
}
```

#### **Consumers** (`consumer/`)

- Process jobs from queues
- Extend `WorkerHost`
- Handle errors with `@OnWorkerEvent`
- Implement graceful shutdown

```typescript
@Processor(QUEUES.CONTENT_AGE_RECOMMENDATION)
export class VideoAgeRecommendationConsumer
  extends WorkerHost
  implements OnApplicationShutdown
{
  constructor(
    private readonly setAgeRecommendationUseCase: SetAgeRecommendationForContentUseCase,
    private readonly logger: AppLogger,
  ) {
    super();
  }

  async onApplicationShutdown() {
    await this.worker.close(true);
  }

  async process(
    job: Job<{ videoId: string; ageRecommendation: number }, void>,
  ) {
    const { videoId, ageRecommendation } = job.data;
    this.logger.log(
      `Processing age recommendation for content with ${job.data.videoId}`,
    );

    try {
      await this.setAgeRecommendationUseCase.execute(
        videoId,
        ageRecommendation,
      );
    } catch (error) {
      this.logger.error(
        `Error processing age recommendation content for video ${videoId}`,
        {
          error,
          videoId: videoId,
        },
      );
      throw new Error(
        `Failed to process age recommendation for content video ID ${videoId}`,
      );
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job failed: ${job.id}`, { job, error });
  }
}
```

### 6. **Test Layer** (`__test__/`)

**Purpose**: Automated testing

#### **E2E Tests** (`e2e/`)

- Full integration tests
- Real database (cleaned between tests)
- Supertest for HTTP requests

```typescript
describe('Subscription e2e test', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([BillingModule]);
    app = nestTestSetup.app;
    module = nestTestSetup.module;
  });

  afterEach(async () => {
    await testDbClient(Tables.Subscription).delete();
    await testDbClient(Tables.Plan).delete();
  });

  it('creates a subscription', async () => {
    const plan = planFactory.build({
      /* ... */
    });
    await testDbClient(Tables.Plan).insert(plan);

    const res = await request(app.getHttpServer())
      .post('/subscription')
      .set('Authorization', `Bearer fake-jwt-token`)
      .send({ planId: plan.id });

    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body).toEqual({
      id: expect.any(String),
      userId: expect.any(String),
      planId: plan.id,
      status: SubscriptionStatus.Active,
      // ...
    });
  });
});
```

#### **Factories** (`factory/`)

- Generate test data with Factory.ts
- Use Faker for realistic data

```typescript
export const subscriptionFactory = Factory.Sync.makeFactory<
  Partial<Subscription>
>({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  planId: faker.string.uuid(),
  status: SubscriptionStatus.Active,
  startDate: faker.date.recent(),
  endDate: null,
  autoRenew: true,
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
});
```

---

## Code Organization Patterns

### 1. **Module Organization**

#### Module Declaration Pattern

```typescript
@Module({
  imports: [
    // Persistence module (if applicable)
    BillingPersistenceModule,

    // External modules
    AuthModule,

    // Sub-modules (for aggregator modules)
    ContentAdminModule,
    ContentCatalogModule,
  ],
  providers: [
    // Services
    SubscriptionService,

    // Use cases
    CreateMovieUseCase,

    // Providers (for integration)
    BillingSubscriptionProvider,

    // Queue producers/consumers
    VideoProcessingJobProducer,
  ],
  controllers: [
    // REST controllers
    SubscriptionController,
  ],
  exports: [
    // Services/Providers used by other modules
    BillingSubscriptionProvider,
  ],
})
export class BillingModule {}
```

### 2. **Dependency Injection Patterns**

#### Constructor Injection

```typescript
@Injectable()
export class CreateMovieUseCase {
  constructor(
    private readonly externalMovieRatingClient: ExternalMovieClient,
    private readonly videoProcessorService: VideoProcessorService,
    private readonly contentRepository: ContentRepository,
  ) {}
}
```

#### Adapter Injection with Symbols

```typescript
// Define adapter symbol
export const VideoAgeRecommendationAdapter = Symbol('VideoAgeRecommendationAdapter');

// Inject adapter
constructor(
  @Inject(VideoAgeRecommendationAdapter)
  private readonly ageRecommendationAdapter: VideoAgeRecommendationAdapter,
) {}

// Provide adapter in module
providers: [
  {
    provide: VideoAgeRecommendationAdapter,
    useClass: GoogleAiAgeRecommendationAdapter,
  },
]
```

### 3. **Entity Initialization**

#### Default Entity Pattern

All entities extend `DefaultEntity`:

```typescript
export abstract class DefaultEntity<T> {
  constructor(data?: Partial<T>) {
    Object.assign(this, data);
    this.id = this.id || randomUUID();
  }

  @BeforeInsert()
  beforeInsert() {
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  beforeUpdate(): void {
    this.updatedAt = new Date();
  }

  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
```

Usage:

```typescript
const subscription = new Subscription({
  userId: '123',
  planId: '456',
  status: SubscriptionStatus.Active,
  startDate: new Date(),
  autoRenew: true,
});
// id, createdAt, updatedAt automatically generated
```

### 4. **Repository Pattern**

#### Default TypeORM Repository

```typescript
export abstract class DefaultTypeOrmRepository<T extends DefaultEntity<T>> {
  private repository: Repository<T>;

  constructor(
    readonly entity: EntityTarget<T>,
    readonly entityManager: EntityManager,
  ) {
    this.repository = entityManager.getRepository(entity);
  }

  async save(entity: T): Promise<T> {
    return await this.repository.save(entity);
  }

  async findOneById(id: string, relations?: string[]): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      relations,
    });
  }

  // Additional base methods...
}
```

#### Custom Repository

```typescript
@Injectable()
export class SubscriptionRepository extends DefaultTypeOrmRepository<Subscription> {
  constructor(
    @InjectDataSource('billing') // Domain-specific data source
    private readonly dataSource: DataSource,
  ) {
    super(Subscription, dataSource.manager);
  }

  // Domain-specific query methods
  async findOneByUserId(userId: string): Promise<Subscription | null> {
    return this.findOne({ where: { userId } });
  }
}
```

### 5. **DTO Transformation Pattern**

#### Request → Domain → Response

```typescript
@Post()
@UseGuards(AuthGuard)
async createSubscription(
  @Body() createSubscriptionRequest: CreateSubscriptionRequestDto,  // 1. Validate request
): Promise<SubscriptionResponseDto> {
  // 2. Execute business logic
  const createdSubscription = await this.subscriptionService.createSubscription(
    createSubscriptionRequest,
  );

  // 3. Transform to response DTO
  return plainToInstance(
    SubscriptionResponseDto,
    { ...createdSubscription, ...{ plan: createdSubscription.plan } },
    { excludeExtraneousValues: true },  // Only include @Expose() decorated fields
  );
}
```

### 6. **Error Handling**

#### Domain Exceptions

```typescript
// Throw NestJS exceptions
throw new NotFoundException(`Plan with id ${planId} not found`);
throw new UnauthorizedException();
throw new BadRequestException({ message: 'Validation failed' });
```

#### Queue Error Handling

```typescript
@OnWorkerEvent('failed')
onFailed(job: Job, error: Error) {
  this.logger.error(`Job failed: ${job.id}`, { job, error });
  // Send to dead letter queue, alert, etc.
}
```

### 7. **Request Context Management**

Use `nestjs-cls` for request-scoped data:

```typescript
// Store in guard/interceptor
this.clsService.set('userId', payload.sub);

// Retrieve in service
const userId = this.clsService.get('userId');
```

---

## Database Patterns

### 1. **Multi-Database Architecture**

Each domain has its own database connection:

- **billing** data source
- **content** data source
- **identity** data source

### 2. **Migration Workflow**

#### Generate Migration

```bash
# Domain-specific migration
pnpm run billing:db:generate
pnpm run content:db:generate
pnpm run identity:db:generate
```

#### Run Migrations

```bash
# Single domain
pnpm run billing:db:migrate

# All domains
pnpm run db:migrate:all
```

#### Drop Schema (development only)

```bash
pnpm run billing:db:drop
```

### 3. **TypeORM Configuration**

```typescript
// typeorm-datasource.ts
export const BillingDataSource = createTypeOrmDataSource(config.database.billing);

// Module registration
TypeOrmModule.forRootAsync({
  name: 'billing',
  useFactory: () => ({
    type: 'postgres',
    // ...config
    entities: [__dirname + '/entity/*.entity{.ts,.js}'],
    migrations: [__dirname + '/migration/*{.ts,.js}'],
  }),
}),
```

### 4. **Transaction Management**

Use `typeorm-transactional` decorators:

```typescript
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class SubscriptionService {
  @Transactional()
  async createSubscription(data: CreateSubscriptionData) {
    // All operations in this method are wrapped in a transaction
    const subscription = await this.subscriptionRepository.save(entity);
    await this.auditRepository.save(auditLog);
    return subscription;
  }
}
```

Initialize in `main.ts`:

```typescript
import { initializeTransactionalContext } from 'typeorm-transactional';

async function bootstrap() {
  initializeTransactionalContext();
  // ...
}
```

---

## Testing Patterns

### 1. **E2E Test Structure**

```typescript
describe('Feature E2E test', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    const nestTestSetup = await createNestApp([ModuleToTest]);
    app = nestTestSetup.app;
    module = nestTestSetup.module;
  });

  beforeEach(async () => {
    // Setup (e.g., fake timers)
    jest
      .useFakeTimers({ advanceTimers: true })
      .setSystemTime(new Date('2023-01-01'));
  });

  afterEach(async () => {
    // Cleanup database
    await testDbClient(Tables.Entity).delete();
  });

  afterAll(async () => {
    await app.close();
    module.close();
  });

  it('should perform action', async () => {
    // Arrange
    const entity = entityFactory.build();
    await testDbClient(Tables.Entity).insert(entity);

    // Act
    const res = await request(app.getHttpServer())
      .post('/endpoint')
      .set('Authorization', `Bearer fake-jwt-token`)
      .send(payload);

    // Assert
    expect(res.status).toBe(HttpStatus.CREATED);
    expect(res.body).toEqual({
      /* expected structure */
    });
  });
});
```

### 2. **Test Utilities**

#### Database Client (Knex)

```typescript
import { testDbClient } from '@testInfra/knex.database';

// Insert test data
await testDbClient(Tables.Subscription).insert(data);

// Clean up
await testDbClient(Tables.Subscription).delete();
```

#### Factory Pattern

```typescript
import { subscriptionFactory } from '@billingModule/__test__/factory/subscription.factory';

// Build single entity
const subscription = subscriptionFactory.build();

// Build with overrides
const activeSubscription = subscriptionFactory.build({
  status: SubscriptionStatus.Active,
});

// Build multiple
const subscriptions = subscriptionFactory.buildList(5);
```

### 3. **Mocking JWT Authentication**

```typescript
const fakeUserId = faker.string.uuid();

jest.mock('jsonwebtoken', () => ({
  verify: (_token: string, _secret: string, _options: any, callback: any) => {
    callback(null, { sub: fakeUserId });
  },
}));
```

### 4. **Test Organization**

```
__test__/
├── e2e/                           # End-to-end tests
│   ├── {feature}/
│   │   └── {feature}.spec.ts     # Feature test suite
│   └── {setup}.{type}.ts         # Setup utilities
└── factory/                       # Test data factories
    └── {entity}.factory.ts
```

---

## Path Aliases

Configure in `tsconfig.json`:

```json
{
  "paths": {
    "@contentModule/*": ["src/module/content/*"],
    "@identityModule/*": ["src/module/identity/*"],
    "@billingModule/*": ["src/module/billing/*"],
    "@sharedModule/*": ["src/module/shared/module/*"],
    "@sharedLibs/*": ["src/module/shared/*"],
    "@testInfra/*": ["test/*"],
    "@src/*": ["src/*"],
    "@resource/*": ["resource/*"]
  }
}
```

### Usage Rules

```typescript
// ✅ Correct - Use path aliases
import { BillingModule } from '@billingModule/billing.module';
import { AuthGuard } from '@sharedModule/auth/guard/auth.guard';
import { testDbClient } from '@testInfra/knex.database';

// ❌ Incorrect - Avoid relative paths
import { BillingModule } from '../../../billing/billing.module';
import { AuthGuard } from '../../shared/module/auth/guard/auth.guard';
```

---

## Best Practices

### 1. **Module Design**

#### ✅ DO:

- Keep modules focused on a single domain
- Export only what's needed by other modules
- Use integration providers for cross-module communication
- Define clear module boundaries

#### ❌ DON'T:

- Directly import services from other domain modules
- Create circular dependencies
- Expose implementation details
- Mix domain concerns

### 2. **Service vs Use Case**

#### Use **Services** when:

- Operation is simple (CRUD)
- Logic is domain-specific but straightforward
- No complex orchestration needed

#### Use **Use Cases** when:

- Orchestrating multiple services
- Complex business workflows
- Need to coordinate external integrations
- Operation has multiple steps with side effects

### 3. **DTOs**

#### ✅ DO:

- Use DTOs for all request/response validation
- Separate request and response DTOs
- Use `@Expose()` decorator on response DTO fields
- Extend common base DTOs when appropriate

```typescript
export class DefaultResponseDto {
  @IsUUID(4)
  @Expose()
  readonly id: string;

  @IsDateString()
  @Expose()
  readonly createdAt: Date;

  @IsDateString()
  @Expose()
  readonly updatedAt: Date;

  @IsDateString()
  @Expose()
  @IsOptional()
  readonly deletedAt: Date | null;
}
```

#### ❌ DON'T:

- Return raw entities from controllers
- Reuse request DTOs as response DTOs
- Skip validation decorators

### 4. **Logging**

#### ✅ DO:

- Use structured logging with context

```typescript
this.logger.log('Processing video', { videoId, action: 'transcribe' });
this.logger.error('Processing failed', { videoId, error, stack: error.stack });
```

#### ❌ DON'T:

- Use `console.log()`
- Log sensitive data (passwords, tokens)

### 5. **Error Handling**

#### ✅ DO:

- Throw appropriate NestJS exceptions
- Provide meaningful error messages
- Log errors with context
- Handle queue failures with retry/dead-letter patterns

#### ❌ DON'T:

- Swallow errors silently
- Expose internal implementation details in error messages
- Use generic error messages

### 6. **Dependency Injection**

#### ✅ DO:

- Inject dependencies via constructor
- Use interfaces for external dependencies
- Use symbols for adapter injection

#### ❌ DON'T:

- Use `@Inject()` unless necessary (symbols, custom providers)
- Create dependencies manually with `new`
- Access module internals directly

### 7. **Database Operations**

#### ✅ DO:

- Use repositories for data access
- Wrap multi-step operations in transactions
- Use migrations for schema changes
- Clean up test data after each test

#### ❌ DON'T:

- Use TypeORM manager directly in services
- Modify schema without migrations
- Share database state between tests

### 8. **Queue Jobs**

#### ✅ DO:

- Keep job payloads small (IDs and essential data)
- Log job lifecycle events
- Handle failures gracefully
- Implement idempotency
- Close workers on shutdown

```typescript
async onApplicationShutdown() {
  await this.worker.close(true);
}
```

#### ❌ DON'T:

- Pass large objects in job payloads
- Leave jobs hanging on shutdown
- Retry forever without dead-letter queue

### 9. **File Organization**

#### ✅ DO:

- Follow the folder structure enforced by `.projectStructurerc.json`
- Use kebab-case for all file names
- Include type suffixes in file names (`.service.ts`, `.controller.ts`)
- Group related files by layer

#### ❌ DON'T:

- Create files outside the established structure
- Mix concerns in single files
- Use camelCase or PascalCase for file names

### 10. **Testing**

#### ✅ DO:

- Write E2E tests for critical flows
- Use factories for test data generation
- Clean database between tests
- Test error cases
- Use descriptive test names

#### ❌ DON'T:

- Share state between tests
- Test implementation details
- Skip edge cases
- Leave test data in database

### 11. **Code Style**

#### ✅ DO:

- Follow ESLint rules
- Use TypeScript strict mode features
- Prefer `const` over `let`
- Use async/await over promises
- Document complex logic

#### ❌ DON'T:

- Disable ESLint rules without justification
- Use `any` type
- Ignore TypeScript errors
- Write overly complex functions

---

## Project Structure Enforcement

This project uses **eslint-plugin-project-structure** to enforce the folder structure defined in `.projectStructurerc.json`.

### Key Rules

1. **Folder names**: Must be kebab-case
2. **File names**: Must follow pattern `{kebab-case}.{type}.ts`
3. **Module structure**: Enforced hierarchy (domain, sub-domain, shared)
4. **Layer separation**: Core, HTTP, persistence, integration, queue

### Validation

```bash
# Check structure compliance
pnpm run lint:check

# Auto-fix where possible
pnpm run lint:fix
```

---

## Entry Points

The application has multiple entry points:

### 1. **Main Application** (`main.ts`)

- Starts the web server
- Handles REST and GraphQL requests
- Port: 3000 (default)

### 2. **Worker Applications** (`{name}.main.ts`)

- Background job processors
- Example: `video-processor-worker.main.ts`
- Processes queue jobs asynchronously

```typescript
// video-processor-worker.main.ts
async function bootstrap() {
  initializeTransactionalContext();
  const logger = LoggerFactory('video-processor-worker');
  const app = await NestFactory.create(ContentVideoProcessorModule, {
    bufferLogs: true,
  });
  app.useLogger(logger);
  const configService = app.get<ConfigService>(ConfigService);
  const port = configService.get('port');
  await app.listen(port);
}
bootstrap();
```

---

## Environment Configuration

Configuration is managed via `@sharedModule/config`:

```typescript
@Injectable()
export class ConfigService {
  get(key: string): any {
    // Returns environment-specific configuration
  }
}
```

### Usage

```typescript
constructor(private readonly configService: ConfigService) {}

async someMethod() {
  const apiUrl = this.configService.get('movieDb').url;
  const apiToken = this.configService.get('movieDb').apiToken;
}
```

---

## Docker Support

### Development

```bash
# Start dependencies only (DB, Redis)
pnpm run docker:start:deps

# Start all services
pnpm run docker:start

# Stop services
pnpm run docker:down
```

### Configuration

- **docker-compose.yml**: Service definitions
- **Dockerfile**: Application container

---

## Common Patterns Summary

### Creating a New Feature

1. **Define domain model** (if needed) in `core/model/`
2. **Create entity** in `persistence/entity/`
3. **Create repository** in `persistence/repository/`
4. **Implement service or use case** in `core/service/` or `core/use-case/`
5. **Create DTOs** in `http/rest/dto/request` and `response/`
6. **Create controller** in `http/rest/controller/`
7. **Register in module** in `{domain}.module.ts`
8. **Write E2E tests** in `__test__/e2e/`

### Adding Cross-Module Integration

1. **Define interface** in `@sharedModule/integration/interface/`
2. **Implement provider** in providing module's `integration/provider/`
3. **Export provider** from providing module
4. **Import module** in consuming module
5. **Inject interface** using symbol

### Adding Queue Job

1. **Define queue name** in `queue/queue.constant.ts`
2. **Define job payload type** in `queue/queue.types.ts`
3. **Create producer** in `queue/producer/`
4. **Create consumer** in `queue/consumer/`
5. **Register in module** with `BullModule`

---

## Conclusion

This architecture guide defines the patterns and conventions for the Fakeflix project. By following these guidelines, you ensure:

- **Consistency**: Uniform code structure across the codebase
- **Maintainability**: Clear separation of concerns and predictable organization
- **Scalability**: Modular design supports growth
- **Testability**: Well-defined layers simplify testing
- **Collaboration**: Clear conventions reduce cognitive load

For questions or clarifications, refer to existing implementations as examples, and maintain consistency with established patterns.

---

**Version**: 1.0  
**Last Updated**: 2026-01-05
