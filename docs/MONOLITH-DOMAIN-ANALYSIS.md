# 📊 Análise de Domínios - Módulo Monolith

## Resumo Executivo

**Domínios Identificados**: 4
**Subdomínios Identificados**: 12
**Problemas de Coesão Críticos**: 5
**Problemas de Coesão Médios**: 3

### Status Geral

- ❌ **Baixa Coesão Geral**: O módulo monolith mistura 4 domínios distintos
- ❌ **Acoplamento Cruzado**: Serviços de Identity acessam conceitos de Billing diretamente
- ⚠️ **Linguagem Ubíqua Misturada**: Conceitos de diferentes domínios compartilham o mesmo espaço

---

## 🎯 Mapa de Domínios

### Domínio 1: Billing (Faturamento)

**Tipo**: Core Domain / Supporting Subdomain  
**Coesão Geral**: 7/10 ⚠️  
**Linguagem Ubíqua**: subscription, plan, invoice, payment, charge, credit, discount, usage, tax, dunning, billing

#### Entidades (15):

- `Subscription` - Assinatura do usuário
- `Plan` - Plano de assinatura
- `Invoice` - Fatura
- `InvoiceLineItem` - Item da fatura
- `Payment` - Pagamento
- `Charge` - Cobrança
- `Credit` - Crédito
- `Discount` - Desconto
- `AddOn` - Complemento da assinatura
- `SubscriptionAddOn` - Associação assinatura-complemento
- `SubscriptionDiscount` - Associação assinatura-desconto
- `UsageRecord` - Registro de uso
- `DunningAttempt` - Tentativa de cobrança após falha
- `TaxCalculationSummary` - Resumo de cálculo de impostos
- `TaxCalculationError` - Erro no cálculo de impostos
- `TaxRate` - Taxa de imposto

#### Serviços (11):

- `SubscriptionService` - Gerenciamento de assinaturas
- `SubscriptionBillingService` - Cobrança de assinaturas
- `InvoiceService` - Gerenciamento de faturas
- `InvoiceGeneratorService` - Geração de faturas
- `UsageBillingService` - Faturamento baseado em uso
- `CreditManagerService` - Gerenciamento de créditos
- `DiscountEngineService` - Motor de descontos
- `TaxCalculatorService` - Cálculo de impostos
- `DunningManagerService` - Gerenciamento de cobranças inadimplentes
- `AddOnManagerService` - Gerenciamento de complementos
- `ProrationCalculatorService` - Cálculo de rateios

#### Controllers (4):

- `SubscriptionController` - CRUD de assinaturas
- `SubscriptionBillingController` - Operações de cobrança
- `InvoiceController` - Operações de faturas
- `CreditController` - Operações de créditos
- `UsageController` - Registro de uso

#### Subdomínios Identificados:

##### 1. **Subscription Management** (Gerenciamento de Assinaturas)

**Tipo**: Core Domain (se assinatura é diferencial) / Supporting  
**Coesão**: 8/10 ✅  
**Conceitos**: Subscription, Plan, SubscriptionService, SubscriptionAddOn, SubscriptionDiscount  
**Responsabilidade**: Ciclo de vida de assinaturas (criar, atualizar, cancelar, renovar)  
**Dependências**: → Invoice Generation (quando precisa gerar fatura)

##### 2. **Invoice Generation** (Geração de Faturas)

**Tipo**: Supporting Subdomain  
**Coesão**: 8/10 ✅  
**Conceitos**: Invoice, InvoiceLineItem, InvoiceGeneratorService, InvoiceService  
**Responsabilidade**: Consolidar cobranças em faturas, calcular totais, aplicar descontos/créditos  
**Dependências**: ← Subscription Management, ← Usage Billing, ← Tax Calculation

##### 3. **Payment Processing** (Processamento de Pagamentos)

**Tipo**: Supporting Subdomain  
**Coesão**: 7/10 ⚠️  
**Conceitos**: Payment, Charge, PaymentGatewayClient  
**Responsabilidade**: Processar pagamentos, gerenciar cobranças  
**Dependências**: ← Invoice Generation

##### 4. **Usage Billing** (Faturamento por Uso)

**Tipo**: Core Domain (se cobrança por uso é diferencial)  
**Coesão**: 8/10 ✅  
**Conceitos**: UsageRecord, UsageBillingService  
**Responsabilidade**: Registrar uso, calcular cobranças baseadas em consumo (tiered pricing)  
**Dependências**: → Subscription Management (verifica assinatura ativa)

##### 5. **Financial Management** (Gestão Financeira)

**Tipo**: Supporting Subdomain  
**Coesão**: 7/10 ⚠️  
**Conceitos**: Credit, Discount, CreditManagerService, DiscountEngineService, AddOn, AddOnManagerService  
**Responsabilidade**: Gerenciar créditos, descontos e complementos  
**Dependências**: → Subscription Management, → Invoice Generation

##### 6. **Tax Calculation** (Cálculo de Impostos)

**Tipo**: Supporting Subdomain  
**Coesão**: 6/10 ⚠️  
**Conceitos**: TaxCalculatorService, TaxRate, TaxCalculationSummary, EasyTaxClient  
**Responsabilidade**: Calcular impostos por região  
**Dependências**: ← Invoice Generation  
**Nota**: Candidato a serviço externo/terceirizado

##### 7. **Dunning Management** (Gestão de Inadimplência)

**Tipo**: Supporting Subdomain  
**Coesão**: 7/10 ⚠️  
**Conceitos**: DunningAttempt, DunningManagerService  
**Responsabilidade**: Gerenciar tentativas de cobrança após falhas de pagamento  
**Dependências**: → Subscription Management, → Payment Processing

**Problemas de Coesão**:

- ❌ **Baixa Coesão** entre Tax Calculation e outros subdomínios (deveria ser genérico)
- ⚠️ **Média Coesão** entre Financial Management (créditos, descontos, add-ons misturados)

---

### Domínio 2: Content (Conteúdo)

**Tipo**: Core Domain  
**Coesão Geral**: 8/10 ✅  
**Linguagem Ubíqua**: movie, tv show, episode, video, content, catalog, media, thumbnail, streaming

#### Entidades (7):

- `Content` - Conteúdo genérico (Movie ou TVShow)
- `Movie` - Filme
- `TvShow` - Série de TV
- `Episode` - Episódio de série
- `Video` - Vídeo (arquivo físico)
- `VideoMetadata` - Metadados do vídeo (transcrição, resumo)
- `Thumbnail` - Miniatura

#### Serviços (3):

- `ContentDistributionService` - Distribuição de conteúdo
- `EpisodeLifecycleService` - Ciclo de vida de episódios
- `ContentAgeRecommendationService` - Recomendação de idade para conteúdo

#### Use Cases (5):

- `CreateMovieUseCase` - Criar filme
- `CreateTvShowUseCase` - Criar série
- `CreateTvShowEpisodeUseCase` - Criar episódio
- `GetStreamingURLUseCase` - Obter URL de streaming
- `SetAgeRecommendationUseCase` / `SetAgeRecommendationForContentUseCase` - Definir classificação etária

#### Controllers (3):

- `AdminMovieController` - Administração de filmes
- `AdminTvShowController` - Administração de séries
- `MediaPlayerController` - Player de mídia (streaming)

#### Subdomínios Identificados:

##### 1. **Content Catalog** (Catálogo de Conteúdo)

**Tipo**: Core Domain  
**Coesão**: 9/10 ✅  
**Conceitos**: Content, Movie, TvShow, Episode, Thumbnail, CreateMovieUseCase, CreateTvShowUseCase, AdminMovieController, AdminTvShowController  
**Responsabilidade**: Gerenciar catálogo de filmes e séries  
**Dependências**: → Video Storage, → Content Moderation

##### 2. **Video Storage** (Armazenamento de Vídeos)

**Tipo**: Supporting Subdomain  
**Coesão**: 8/10 ✅  
**Conceitos**: Video, VideoMetadata  
**Responsabilidade**: Armazenar vídeos e metadados  
**Dependências**: ← Content Catalog, ← Video Processing

##### 3. **Content Streaming** (Streaming de Conteúdo)

**Tipo**: Core Domain  
**Coesão**: 9/10 ✅  
**Conceitos**: GetStreamingURLUseCase, MediaPlayerController, ContentDistributionService  
**Responsabilidade**: Entregar conteúdo para reprodução  
**Dependências**: → Video Storage

##### 4. **Content Moderation** (Moderação de Conteúdo)

**Tipo**: Supporting Subdomain  
**Coesão**: 7/10 ⚠️  
**Conceitos**: ContentAgeRecommendationService, SetAgeRecommendationUseCase  
**Responsabilidade**: Classificar conteúdo por idade  
**Dependências**: → Content Catalog

**Problemas de Coesão**:

- ✅ **Alta Coesão** dentro do domínio Content
- ⚠️ **Média Coesão** entre Content Moderation e Content Catalog (classificação etária poderia ser parte do catálogo)

---

### Domínio 3: Identity (Identidade)

**Tipo**: Generic Subdomain  
**Coesão Geral**: 3/10 ❌  
**Linguagem Ubíqua**: user, authentication, authorization, access, identity

#### Entidades (1):

- `User` - Usuário

#### Serviços (2):

- `AuthService` - Autenticação (⚠️ **PROBLEMA**: Verifica status de assinatura!)
- `UserManagementService` - Gerenciamento de usuários

#### Controllers (2):

- `AuthResolver` - GraphQL resolver para autenticação
- `UserResolver` - GraphQL resolver para usuários

#### Subdomínios Identificados:

##### 1. **User Authentication** (Autenticação de Usuários)

**Tipo**: Generic Subdomain  
**Coesão**: 3/10 ❌  
**Conceitos**: User, AuthService, AuthResolver  
**Responsabilidade**: Autenticar usuários (login, JWT)  
**Dependências**: → Billing Subscription (❌ **PROBLEMA!**)  
**Problema**: AuthService verifica status de assinatura (conceito de Billing), violando boundaries

##### 2. **User Management** (Gerenciamento de Usuários)

**Tipo**: Generic Subdomain  
**Coesão**: 7/10 ⚠️  
**Conceitos**: User, UserManagementService, UserResolver  
**Responsabilidade**: CRUD de usuários  
**Dependências**: Nenhuma

**Problemas de Coesão Críticos**:

- ❌ **BAIXA COESÃO CRÍTICA**: `AuthService` injeta `BillingSubscriptionApi` e verifica `isUserSubscriptionActive`
  - **Problema**: Mistura conceitos de Identity (quem você é) com Billing (se pode acessar)
  - **Impacto**: Acoplamento conceitual entre domínios
  - **Solução Sugerida**: Criar um Guard/Middleware separado para verificar assinatura APÓS autenticação bem-sucedida

---

### Domínio 4: Video Processing (Processamento de Vídeos)

**Tipo**: Supporting Subdomain  
**Coesão Geral**: 7/10 ⚠️  
**Linguagem Ubíqua**: transcription, summary, recommendation, processing, moderation, metadata

#### Serviços (1):

- `VideoProcessorService` - Processamento de vídeos (orquestrador)

#### Use Cases (3):

- `TranscribeVideoUseCase` - Transcrever vídeo (gerar legendas)
- `GenerateSummaryForVideoUseCase` - Gerar resumo do vídeo
- `SetAgeRecommendationUseCase` - Definir classificação etária (via ML)

#### Clients (2):

- `GeminiTextExtractorClient` - Extração de texto via Gemini AI
- `ExternalMovieRatingClient` - Obter classificação etária de fonte externa

#### Subdomínios Identificados:

##### 1. **Video Metadata Generation** (Geração de Metadados)

**Tipo**: Supporting Subdomain  
**Coesão**: 8/10 ✅  
**Conceitos**: TranscribeVideoUseCase, GenerateSummaryForVideoUseCase, VideoProcessorService  
**Responsabilidade**: Gerar metadados automáticos (transcrição, resumo) usando IA  
**Dependências**: → Content Domain (VideoMetadata)

##### 2. **Content Moderation** (Moderação de Conteúdo)

**Tipo**: Supporting Subdomain  
**Coesão**: 6/10 ⚠️  
**Conceitos**: SetAgeRecommendationUseCase, ExternalMovieRatingClient  
**Responsabilidade**: Determinar classificação etária  
**Dependências**: → Content Domain (Content.ageRecommendation)  
**Nota**: Overlaps com Content Domain (ContentAgeRecommendationService)

**Problemas de Coesão**:

- ⚠️ **Média Coesão**: Content Moderation está dividido entre Content Domain e Video Processing Domain
- ⚠️ **Responsabilidade Unclear**: Quem é dono de `ageRecommendation`? Content ou Video Processing?

---

## 📉 Matriz de Coesão

| Domínio A            | Domínio B            | Coesão   | Tipo de Relacionamento                                  | Problema?      |
| -------------------- | -------------------- | -------- | ------------------------------------------------------- | -------------- |
| **Identity**         | **Billing**          | **2/10** | AuthService → SubscriptionService (verifica status)     | ❌ **CRÍTICO** |
| **Content**          | **Video Processing** | **6/10** | Content.ageRecommendation ← SetAgeRecommendationUseCase | ⚠️ Médio       |
| **Content**          | **Billing**          | **1/10** | Nenhuma relação direta (correto)                        | ✅ OK          |
| **Identity**         | **Content**          | **1/10** | Nenhuma relação direta (correto)                        | ✅ OK          |
| **Billing**          | **Video Processing** | **0/10** | Nenhuma relação (correto)                               | ✅ OK          |
| **Video Processing** | **Identity**         | **0/10** | Nenhuma relação (correto)                               | ✅ OK          |

---

## 🚨 Problemas de Baixa Coesão Detectados

### Problema #1: Acoplamento Conceitual Identity → Billing

**Localização**: `src/module/monolith/service/authentication.service.ts` (linhas 12-37)  
**Tipo**: Cross-Domain Coupling (Conceitual + Técnico)  
**Severidade**: ❌ **CRÍTICA**

**Problema**:

```typescript
// AuthService (Identity Domain)
@Inject(BillingSubscriptionApi)
private readonly subscriptionServiceClient: BillingSubscriptionApi

async signIn(email: string, password: string) {
  // ... autenticação bem-sucedida ...

  // ❌ PROBLEMA: Verificando conceito de Billing dentro de Identity
  const isSubscriptionActive =
    await this.subscriptionServiceClient.isUserSubscriptionActive(user.id);

  if (!isSubscriptionActive) {
    throw new UnauthorizedException('User subscription is not active');
  }
}
```

**Conceitos Envolvidos**:

- `User` (Identity Domain)
- `Subscription` (Billing Domain)

**Coesão**: 2/10

**Por que é um problema?**:

1. **Mistura de Responsabilidades**:

   - AuthService deveria apenas responder: "Quem é você?" (Authentication)
   - Não deveria responder: "Você pode acessar?" (Authorization baseada em subscription)

2. **Acoplamento Conceitual**:

   - Identity Domain precisa conhecer conceitos de Billing Domain
   - Mudanças em Billing podem afetar Identity

3. **Linguagem Ubíqua Misturada**:
   - "Authentication" (Identity) ≠ "Subscription Status" (Billing)
   - São concerns diferentes

**Impacto**:

- Impossível extrair Identity como serviço separado sem levar Billing junto
- Testes de Identity precisam mockar Billing
- Viola Single Responsibility Principle

**Solução Sugerida**:

#### Opção 1: Guard/Middleware (Recomendado ✅)

```typescript
// 1. AuthService APENAS autentica
@Injectable()
export class AuthService {
  async signIn(email: string, password: string) {
    const user = await this.userRepository.findOneByEmail(email);
    if (!user || !(await this.comparePassword(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ✅ Retorna token SEM verificar subscription
    return { accessToken: await this.jwtService.signAsync({ sub: user.id }) };
  }
}

// 2. Guard separado verifica subscription
@Injectable()
export class ActiveSubscriptionGuard implements CanActivate {
  constructor(
    @Inject(BillingSubscriptionApi)
    private readonly subscriptionService: BillingSubscriptionApi,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;

    if (!userId) return false;

    // ✅ Verificação de subscription é uma AUTORIZAÇÃO, não autenticação
    return this.subscriptionService.isUserSubscriptionActive(userId);
  }
}

// 3. Aplicar Guard onde necessário
@Controller('stream')
export class MediaPlayerController {
  @UseGuards(AuthGuard, ActiveSubscriptionGuard) // ✅ Separação clara
  @Get(':videoId')
  async streamVideo(@Param('videoId') videoId: string) {
    // ...
  }
}
```

#### Opção 2: Policy-Based Authorization

```typescript
// Política de acesso baseada em subscription
@Injectable()
export class SubscriptionPolicy {
  async canAccessContent(userId: string): Promise<boolean> {
    return this.subscriptionService.isUserSubscriptionActive(userId);
  }
}
```

**Prioridade**: 🔴 **HIGH** - Bloqueia refatoração para arquitetura modular

---

### Problema #2: Responsabilidade Dividida - Age Recommendation

**Localização**:

- `src/module/monolith/service/content-age-recommendation.service.ts`
- `src/module/monolith/use-case/set-age-recommendation.use-case.ts`

**Tipo**: Mixed Responsibilities  
**Severidade**: ⚠️ **MÉDIA**

**Problema**:
`ageRecommendation` está espalhado em 2 domínios:

1. **Content Domain**: `ContentAgeRecommendationService`
   - Lógica: "Classificação do conteúdo é a maior classificação de seus vídeos"
2. **Video Processing Domain**: `SetAgeRecommendationUseCase`
   - Lógica: "Determinar classificação via ML/external API"

**Conceitos Envolvidos**:

- `Content.ageRecommendation` (Content Domain)
- `SetAgeRecommendationUseCase` (Video Processing Domain)

**Coesão**: 6/10

**Por que é um problema?**:

- Não está claro QUEM é o dono dessa responsabilidade
- Mudanças em classificação etária afetam 2 domínios

**Solução Sugerida**:

#### Opção 1: Mover tudo para Content Domain (Recomendado ✅)

```typescript
// Content Domain é dono de ageRecommendation
// Video Processing apenas gera a recomendação e notifica Content

// 1. Video Processing gera recomendação
class GenerateAgeRecommendationUseCase {
  async execute(videoId: string): Promise<number> {
    const ageRating = await this.externalRatingClient.getAge(videoId);

    // ✅ Publica evento, não altera Content diretamente
    await this.eventBus.publish(
      new AgeRecommendationGeneratedEvent(videoId, ageRating),
    );

    return ageRating;
  }
}

// 2. Content Domain escuta e atualiza
class AgeRecommendationGeneratedHandler {
  async handle(event: AgeRecommendationGeneratedEvent) {
    const content = await this.contentRepo.findByVideoId(event.videoId);

    // ✅ Content Domain aplica sua lógica de negócio
    this.contentAgeRecommendationService.setAgeRecommendationForContent(
      content,
      event.ageRating,
    );

    await this.contentRepo.save(content);
  }
}
```

**Prioridade**: 🟡 **MEDIUM**

---

### Problema #3: Tax Calculation - Subdomain Genérico em Domain de Suporte

**Localização**: `src/module/monolith/service/tax-calculator.service.ts`  
**Tipo**: Generic in Core  
**Severidade**: ⚠️ **MÉDIA**

**Problema**:
`TaxCalculatorService` está dentro de Billing Domain, mas:

- Cálculo de impostos é funcionalidade genérica
- Poderia ser terceirizado/comprado
- Não é específico do negócio

**Conceitos Envolvidos**:

- `TaxCalculatorService` (Billing Domain)
- `EasyTaxClient` (External)

**Coesão**: 6/10

**Por que é um problema?**:

- Billing Domain tem lógica genérica misturada com lógica core
- Aumenta complexidade desnecessariamente

**Solução Sugerida**:

```typescript
// Mover Tax Calculation para Generic Subdomain ou serviço externo

// Billing Domain apenas consome interface
interface TaxCalculationService {
  calculateTax(amount: number, region: string): Promise<TaxResult>;
}

// Implementação pode ser:
// - EasyTax (third-party)
// - Avalara (third-party)
// - Custom (se necessário)

// Billing Domain não precisa saber detalhes
@Injectable()
export class InvoiceGeneratorService {
  constructor(
    @Inject(TaxCalculationService)
    private readonly taxService: TaxCalculationService
  ) {}

  async generateInvoice(...) {
    const tax = await this.taxService.calculateTax(subtotal, region);
    // ...
  }
}
```

**Prioridade**: 🟡 **MEDIUM**

---

### Problema #4: User Entity - Anêmica e Genérica

**Localização**: `src/module/monolith/entity/user.entity.ts`  
**Tipo**: Unclear Boundaries  
**Severidade**: ⚠️ **BAIXA**

**Problema**:

```typescript
@Entity({ name: 'User' })
export class User extends DefaultEntity<User> {
  @Column() firstName: string;
  @Column() lastName: string;
  @Column({ unique: true }) email: string;
  @Column() password: string;
}
```

- Entity muito genérica
- Usada em múltiplos contextos (Identity, Billing)
- Sem comportamento (anêmica)

**Por que é um problema?**:

- "User" pode significar coisas diferentes em contextos diferentes:
  - Identity Context: credenciais, autenticação
  - Billing Context: customer, payment info
  - Content Context: preferences, watch history

**Solução Sugerida**:

Quando separar em módulos, criar conceitos específicos:

```typescript
// Identity Context
class User {
  id: string;
  email: string;
  password: string;
  emailVerified: boolean;
  lastLogin: Date;
}

// Billing Context
class Customer {
  userId: string; // referência
  billingAddress: Address;
  paymentMethods: PaymentMethod[];
  subscriptions: Subscription[];
}

// Content Context
class Viewer {
  userId: string; // referência
  watchHistory: Video[];
  preferences: Genre[];
  recommendations: Content[];
}
```

**Prioridade**: 🟢 **LOW** (pode ser tratado durante migração modular)

---

### Problema #5: Financial Management - Subdomain com Muitas Responsabilidades

**Localização**: `src/module/monolith/service/`  
**Tipo**: Mixed Responsibilities  
**Severidade**: ⚠️ **MÉDIA**

**Problema**:
Financial Management subdomain agrupa conceitos não-coesos:

- Credits (créditos de refund)
- Discounts (descontos promocionais)
- AddOns (complementos de plano)

Estes conceitos têm ciclos de vida diferentes:

- Credits: gerados por refunds/compensações
- Discounts: configurados por marketing/vendas
- AddOns: produtos adicionais à assinatura

**Coesão**: 5/10

**Solução Sugerida**:
Separar em subdomínios menores quando migrar:

```
Billing Domain
├── Subscription Management
├── Invoice Generation
├── Payment Processing
├── Usage Billing
├── Credit Management (separado)
├── Discount Engine (separado)
├── AddOn Management (pode ser parte de Subscription)
└── Dunning Management
```

**Prioridade**: 🟢 **LOW** (pode ser tratado durante migração modular)

---

## 📊 Resumo

### ✅ Pontos Positivos

1. **Content Domain** tem alta coesão (8/10)

   - Conceitos bem definidos
   - Linguagem ubíqua clara
   - Subdomínios lógicos

2. **Billing Domain** tem boa estruturação

   - Subdomínios bem separados
   - Conceitos coesos dentro de cada subdomain

3. **Uso de interfaces** para integrações
   - `BillingSubscriptionApi` é uma interface
   - Desacoplamento técnico (não conceitual)

### ❌ Pontos Críticos

1. **Identity Domain acoplado a Billing** (❌ **CRÍTICO**)

   - AuthService verifica subscription
   - Bloqueia modularização

2. **Responsabilidades divididas**

   - Age Recommendation espalhado
   - Content Moderation unclear

3. **Monolith verdadeiro**
   - 4 domínios misturados
   - Sem boundaries explícitas
   - Difícil manutenção e evolução

### 🎯 Próximos Passos Recomendados

#### 1. **Curto Prazo** (Resolver Críticos)

- [ ] Refatorar AuthService para remover verificação de subscription
- [ ] Criar ActiveSubscriptionGuard para authorization
- [ ] Documentar boundaries conceituais dos domínios

#### 2. **Médio Prazo** (Preparar Modularização)

- [ ] Definir interfaces públicas de cada domínio
- [ ] Mover Age Recommendation para Content Domain
- [ ] Separar Tax Calculation como Generic Subdomain

#### 3. **Longo Prazo** (Modularização)

- [ ] Extrair Identity como módulo separado
- [ ] Extrair Billing como módulo separado
- [ ] Extrair Content como módulo separado
- [ ] Manter Video Processing como parte de Content ou módulo separado

---

## 📋 Mapa Visual de Domínios

```
┌─────────────────────────────────────────────────────────────────┐
│                      FAKEFLIX MONOLITH                          │
│                    (4 Domínios Misturados)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
        │   BILLING    │ │  CONTENT   │ │  IDENTITY  │
        │   (Core/     │ │  (Core)    │ │ (Generic)  │
        │  Support)    │ │            │ │            │
        │  Coesão: 7/10│ │ Coesão:8/10│ │Coesão:3/10 │
        └───────┬──────┘ └─────┬──────┘ └─────┬──────┘
                │               │               │
                │               │       ❌ PROBLEMA #1
                │               │       Acoplamento
                │               │       Identity→Billing
                │               │               │
       ┌────────┴────────┐     │      ┌────────┴────────┐
       │                 │     │      │                 │
  ┌────▼────┐      ┌────▼────┐│ ┌────▼────┐      ┌────▼────┐
  │Subscrip │      │Usage    ││ │Auth     │      │User Mgmt│
  │tion     │      │Billing  ││ │         │      │         │
  │Mgmt     │      │         ││ │         │      │         │
  └─────────┘      └─────────┘│ └─────────┘      └─────────┘
                               │
  ┌─────────┐      ┌─────────┐│ ┌─────────┐
  │Invoice  │      │Payment  ││ │Content  │
  │Generate │      │Process  ││ │Catalog  │
  └─────────┘      └─────────┘│ └─────────┘
                               │
  ┌─────────┐      ┌─────────┐│ ┌─────────┐      ┌─────────┐
  │Tax Calc │      │Dunning  ││ │Video    │      │Content  │
  │         │      │Mgmt     ││ │Storage  │      │Streaming│
  └─────────┘      └─────────┘│ └─────────┘      └─────────┘
                               │
  ┌─────────┐                 │        ⚠️ PROBLEMA #2
  │Financial│                 │        Age Recommendation
  │Mgmt     │                 │        dividido entre
  └─────────┘                 │        Content e Video
                               │        Processing
                       ┌───────▼────────┐
                       │VIDEO PROCESSING│
                       │  (Supporting)  │
                       │  Coesão: 7/10  │
                       └────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
             ┌──────▼──────┐      ┌──────▼──────┐
             │Video        │      │Content      │
             │Metadata Gen │      │Moderation   │
             └─────────────┘      └─────────────┘
```

---

## 📋 Checklist de Validação

- [x] Todos os guidelines foram seguidos
- [x] 5 etapas do processo de identificação completadas
- [x] Scores de coesão calculados
- [x] 6 regras de detecção de baixa coesão aplicadas
- [x] Output no formato especificado
- [x] Recomendações acionáveis
- [x] Resumo com overview claro
- [x] Issues priorizadas (High/Medium/Low)

---

**Observação Final**: Este é um monolith clássico que mistura 4 domínios distintos. A boa notícia é que os domínios já estão implicitamente separados pela linguagem ubíqua - agora precisa tornar essas boundaries explícitas através de módulos ou serviços separados. O maior problema é o acoplamento entre Identity e Billing, que deve ser resolvido prioritariamente.
