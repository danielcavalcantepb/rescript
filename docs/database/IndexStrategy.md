# Estratégia de Índices Conceituais

> Sem CREATE INDEX. Priorizar (organization_id, …) em tabelas tenantadas.

| Índice conceitual | Consulta | Seletividade | Estágio |
|---|---|---|---|
| *(org, id)* / PK | ponto | alta | MVP |
| membership(user_id, status) | minhas orgs | alta | MVP |
| membership(org, user) | authz | alta | MVP |
| customer(org, document) | unicidade/busca | alta | MVP |
| customer(org, name) | search | média | MVP |
| variant(org, sku) | unicidade | alta | MVP |
| variant(org, barcode) | PDV futuro | média | MVP |
| balance(org, location, variant) | estoque | alta | MVP |
| movement(org, variant, occurred_at) | histórico | média | MVP |
| movement(org, source_type, source_id) | rastreio | alta | MVP |
| reservation(org, status, expires_at) | expiração | média | MVP |
| reservation(org, source) | por sale | alta | MVP |
| sale(org, status, updated_at) | listas | média | MVP |
| sale(org, confirmed_at) | período | média | MVP |
| sale(org, customer_id, confirmed_at) | histórico cliente | média | MVP |
| installment(org, status, due_date) | vencidos | alta | MVP |
| payment(org, paid_at) | caixa | média | MVP |
| payment(org, idempotency_key) | idem | alta | MVP |
| outbox(status, next_retry_at) | worker | alta | MVP |
| audit(org, occurred_at) | trilha | média | MVP |
| insight(org, status, relevance) | home | média | MVP |
| import(org, idempotency_key) | dedup | alta | MVP |
| external_mapping(org, provider, external_id) | sync | alta | V1 |

### Riscos
- Excesso de índices em tabelas quentes (movement) — adicionar com evidência.
- Índices parciais (WHERE status=active) preferíveis para reservations/insights.
