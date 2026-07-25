# Regras de Unicidade

| Escopo | Chave lógica | Observação |
|---|---|---|
| global | User.email / auth_subject | identidade |
| global | User.id, Org.id, … | PK |
| org | Membership (user_id) where active | um vínculo ativo |
| org | Invite (email) where pending | |
| org | Customer.document | se document NOT NULL |
| org | Customer.external_id + source | import/integração |
| org | ProductVariant.sku | se sku NOT NULL |
| org | ProductVariant.barcode | se set |
| product | combination_hash | anti-caos |
| org | Sale.sale_number | documental |
| org | Sale.idempotency_key | confirm |
| org | Payment.idempotency_key | |
| org | Payment (source, external_ref) | recomendado se ref |
| org | IdempotencyRecord (operation, key) | |
| org | ImportJob.idempotency_key | |
| org | Insight (fingerprint) where active | dedup |
| org | Outbox opcional dedup key | se necessário |
| platform | Plan.code | não “Free” hardcode domínio |
| provider | WebhookDelivery (provider, event_id) | FUT |
| location+variant | InventoryBalance | 1 row |
| org+loc+variant | AverageCostCurrent | OQ-09 |

**Não usar** sequência global como unicidade de segurança.
