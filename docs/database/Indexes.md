# Índices Conceituais (sem SQL)

| Índice lógico | Consulta beneficiada | Seletividade | Composição | Trade-off | Estágio |
|---|---|---|---|---|---|
| PK (id) | ponto | alta | — | — | MVP |
| (organization_id) implícito em compostos | isolamento | — | quase sempre leading | obrigatório RLS+query | MVP |
| membership (user_id, status) | minhas orgs | alta | sim | — | MVP |
| membership (org_id, user_id) | authz | alta | unique partial | — | MVP |
| customer (org, document) | unique/busca | alta | partial WHERE NOT NULL | — | MVP |
| customer (org, name) | search | média | — | trigram FUT | MVP |
| variant (org, sku) | unique/busca | alta | partial | — | MVP |
| balance (org, location, variant) | estoque | alta | unique | — | MVP |
| movement (org, variant, occurred_at) | histórico | média | sim | volume cresce | MVP |
| movement (org, source_type, source_id) | rastreio Sale | alta | sim | — | MVP |
| reservation (org, status, expires_at) | job expire | média | sim | — | MVP |
| reservation (org, source) | por Sale | alta | sim | — | MVP |
| sale (org, status, updated_at) | listas | média | sim | — | MVP |
| sale (org, confirmed_at) | período | média | sim | — | MVP |
| sale (org, customer_id, confirmed_at) | histórico cliente | média | sim | — | MVP |
| installment (org, status, due_on) | vencidos | alta | sim | — | MVP |
| payment (org, paid_at) | caixa | média | sim | — | MVP |
| payment (org, idempotency_key) | idem | alta | unique | — | MVP |
| outbox (status, next_retry_at) | worker | alta | sim | hot table | MVP |
| audit (org, occurred_at) | trilha | média | sim | retenção/partição FUT | MVP |
| insight (org, status, severity) | Central | média | sim | — | MVP |
| import (org, idempotency_key) | dedup | alta | unique | — | MVP |
| file (org, id) | storage meta | alta | — | — | MVP |

**Excesso:** evitar índice por coluna isolada de baixo filtro; preferir compostos com `organization_id` leading.

**Particionamento futuro:** audit, movement, outbox por tempo em >10k orgs ativas — ver Performance.md.
