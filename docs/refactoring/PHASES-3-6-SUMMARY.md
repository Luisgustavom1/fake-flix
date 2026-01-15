# Fases 3-6: Implementação Completa

Os arquivos detalhados para as fases restantes estão disponíveis:

- **Fase 3**: [PHASE-3-INVOICE-BUILDER.md](./PHASE-3-INVOICE-BUILDER.md)
- **Fase 4**: [PHASE-4-DOMAIN-EVENTS.md](./PHASE-4-DOMAIN-EVENTS.md)
- **Fase 5**: [PHASE-5-GRADUAL-MIGRATION.md](./PHASE-5-GRADUAL-MIGRATION.md)
- **Fase 6**: [PHASE-6-CLEANUP.md](./PHASE-6-CLEANUP.md)

---

## 📦 Resumo das Fases Restantes

### Fase 3: Invoice Builder (1 semana)

**Objetivo**: Extrair lógica de construção de invoice para Domain Service

**Principais Entregas**:

- `InvoiceBuilder` Domain Service
- Extração de ~40 linhas do Use Case
- Use Case reduzido para ~30 linhas

### Fase 4: Domain Events (1 semana)

**Objetivo**: Adicionar eventos de domínio para rastreabilidade

**Principais Entregas**:

- Interface `IEventBus`
- `SubscriptionPlanChangedEvent`
- Integração no Domain Model e Use Case
- Event publishing após save

### Fase 5: Migração Gradual (1 semana)

**Objetivo**: Migrar outros métodos e deprecar Transaction Script

**Principais Entregas**:

- `@deprecated` no service antigo
- 3-4 novos use cases
- Controllers usando Use Cases exclusivamente

### Fase 6: Cleanup (1 semana)

**Objetivo**: Remover código legado e finalizar documentação

**Principais Entregas**:

- Remoção do Transaction Script
- Documentação atualizada
- Performance benchmarks finais

---

## 🎯 Status Atual

Você completou:

- ✅ Fase 0: Preparação
- ✅ Fase 1: Domain Model
- ✅ Fase 2: Use Case

Próximos passos:

- ⏳ Fase 3: Invoice Builder
- ⏳ Fase 4: Domain Events
- ⏳ Fase 5: Migração Gradual
- ⏳ Fase 6: Cleanup

---

Para continuar, abra o arquivo da próxima fase que deseja implementar.
