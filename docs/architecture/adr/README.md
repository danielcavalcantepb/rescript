# Architecture Decision Records (ADRs)

> Registro formal das decisões arquiteturais mais importantes do Rescript. Cada ADR captura contexto, alternativas, decisão, consequências, riscos e gatilhos de revisão.
> Status geral: **Proposto / Aceito nesta fase de arquitetura (pré-implementação).**

---

## Formato

Cada ADR contém: Contexto · Problema · Alternativas · Decisão · Justificativa · Consequências positivas · Consequências negativas · Riscos · Gatilhos de revisão.

## Índice

| # | Decisão | Reversibilidade |
|---|---|---|
| [0001](0001-stack.md) | Stack tecnológica | Média (borda) / Baixa (Postgres) |
| [0002](0002-modular-monolith.md) | Monólito modular | Média |
| [0003](0003-multi-tenancy.md) | Multi-tenancy (RLS + organization_id) | **Baixa (cara de mudar)** |
| [0004](0004-authorization.md) | Autorização (RBAC por permissões) | Média |
| [0005](0005-inventory-ledger.md) | Estoque como ledger | **Baixa (cara de mudar)** |
| [0006](0006-financial-model.md) | Modelo financeiro (entidades separadas) | **Baixa (cara de mudar)** |
| [0007](0007-sale-atomicity.md) | Atomicidade da venda | **Baixa (cara de mudar)** |
| [0008](0008-internal-events.md) | Eventos internos de domínio | Média |
| [0009](0009-outbox.md) | Padrão outbox + fila em PostgreSQL | Média |
| [0010](0010-insights.md) | Insights determinísticos | Média |
| [0011](0011-fiscal-integration.md) | Fiscal por integração (adapter) | Alta |
| [0012](0012-repository-structure.md) | Estrutura do repositório (monorepo mínimo) | Alta |
| [0013](0013-deploy.md) | Estratégia de deploy | Alta |
| [0014](0014-testing.md) | Estratégia de testes | Alta |
| [0015](0015-observability.md) | Observabilidade | Alta |
| [0016](0016-weighted-average-costing.md) | Custeio médio ponderado | Média |
| [0017](0017-inventory-reservation-mvp.md) | Reserva de estoque no MVP | Média |
| [0018](0018-sale-without-order-aggregate.md) | Sale único (sem Order no MVP) | Média |
| [0019](0019-discount-authorization-policy.md) | Política de autorização de desconto | Alta |

> **Reversibilidade baixa** = decisão cara de mudar depois; por isso é fixada agora com cuidado. **Alta** = pode evoluir sem grande custo.
>
> Decisões do fundador que embasam ADRs 0016–0019: `docs/domain/FounderDecisions.md`.
