# Plano de Implementação: Refatoração DDD Tático - changePlanForUser

**Status**: Planejamento  
**Duração Estimada**: 6-8 semanas  
**Tipo**: Migração Gradual com Compatibilidade Retroativa

---

## 📋 Índice de Fases

| Fase | Arquivo                                                        | Duração   | Status      |
| ---- | -------------------------------------------------------------- | --------- | ----------- |
| 0    | [PHASE-0-PREPARATION.md](./PHASE-0-PREPARATION.md)             | 1 semana  | ⏳ Pendente |
| 1    | [PHASE-1-DOMAIN-MODEL.md](./PHASE-1-DOMAIN-MODEL.md)           | 2 semanas | ⏳ Pendente |
| 2    | [PHASE-2-USE-CASE.md](./PHASE-2-USE-CASE.md)                   | 1 semana  | ⏳ Pendente |
| 3    | [PHASE-3-INVOICE-BUILDER.md](./PHASE-3-INVOICE-BUILDER.md)     | 1 semana  | ⏳ Pendente |
| 4    | [PHASE-4-DOMAIN-EVENTS.md](./PHASE-4-DOMAIN-EVENTS.md)         | 1 semana  | ⏳ Pendente |
| 5    | [PHASE-5-GRADUAL-MIGRATION.md](./PHASE-5-GRADUAL-MIGRATION.md) | 1 semana  | ⏳ Pendente |
| 6    | [PHASE-6-CLEANUP.md](./PHASE-6-CLEANUP.md)                     | 1 semana  | ⏳ Pendente |

---

## 🎯 Contexto e Análise

### Estado Atual

- **Padrão Detectado**: Transaction Script puro
- **Complexidade**: 178 linhas em `changePlanForUser`
- **Problema Principal**: 100% da lógica de negócio no Application Service
- **Separação Domain/Infrastructure**: ❌ Inexistente (ORM Entity = Domain Entity)

### Padrão do Projeto (baseado em /content)

- ✅ Use Cases em `core/use-case/`
- ✅ Services (Transaction Script) ainda presentes em `core/service/`
- ✅ Entities TypeORM em `persistence/entity/`
- ✅ Repositories em `persistence/repository/`
- ⚠️ **SEM pasta `domain/` separada** (ainda em transição)
- ⚠️ **IDs são strings simples** (sem Value Objects)

### Princípios de Implementação

1. **Compatibilidade**: Transaction Scripts continuam funcionando durante migração
2. **Pragmatismo**: Não criar Value Objects para IDs simples
3. **Gradual**: Introduzir Rich Domain Model sem quebrar código existente
4. **Padrão Existente**: Seguir estrutura de `/content`

---

## 📊 Métricas de Sucesso

### Quantitativas

- **Linhas de código**: 178 → ~50 no Use Case (-72%)
- **Cyclomatic Complexity**: 25 → ~8 (-68%)
- **Test Coverage**: Manter 80%+
- **Performance**: Manter <500ms (p95)

### Qualitativas

- **Manutenibilidade**: ⭐⭐⭐⭐⭐ (vs ⭐⭐ atual)
- **Testabilidade**: Domain logic isolado e testável
- **Clareza**: Intenção explícita no Domain Model
- **Extensibilidade**: Fácil adicionar novos behaviors

---

## ⚠️ Riscos e Mitigações

| Risco                           | Probabilidade | Impacto | Mitigação                             |
| ------------------------------- | ------------- | ------- | ------------------------------------- |
| **Regressão em produção**       | Média         | Alto    | Feature flag + testes E2E completos   |
| **Performance degradação**      | Baixa         | Médio   | Benchmarks antes/depois + profiling   |
| **Mapper bugs (Domain ↔ ORM)** | Média         | Alto    | Testes exhaustivos de conversão       |
| **Breaking changes na API**     | Baixa         | Alto    | Response DTOs compatíveis             |
| **Eventos perdidos**            | Alta          | Médio   | Começar com logs (não message broker) |

---

## 🚀 Como Executar

1. Comece pela **Fase 0** (Preparação)
2. Execute cada fase em ordem
3. Valide o checklist ao final de cada fase
4. Só avance se todos os testes passarem
5. Mantenha branch separada até Fase 5

---

## 📚 Referências

- [TACTICAL-DDD-GUIDELINES.md](../TACTICAL-DDD-GUIDELINES.md)
- [Implementing Domain-Driven Design - Vernon](https://www.amazon.com/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577)
- [Domain-Driven Design - Evans](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)

---

**Última Atualização**: 2026-01-14  
**Autor**: AI Assistant  
**Revisão Necessária**: Tech Lead
