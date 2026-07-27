---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / ConcurrencyCoverage
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cobertura de Concorrência

| Cenário | Conflito | Mecanismo | Resultado esperado |
|---|---|---|---|
| 05 | Dois editores Sale | optimistic `version` | um 409 conflict |
| 09 | Double confirm | idempotency_key | uma confirmação |
| 10 | Dois vendedores estoque | row lock Balance ordenado + H-02/RN-34 | um falha se insuficiente |
| 11 | Expire 2× | status gate | no-op segunda |
| 16 | Dup payment | idempotency + unique | um payment |
| 24 | Import ∥ create SKU | unique (org,sku) | um vence |
| 51 | Expire ∥ Confirm | lock Reservation/Balance | um vence; sem reserved negativo |
| 32 | Retry pós-commit | IdempotencyRecord | replay resultado |
| 30 | Webhook dup | (provider,event_id) | uma aplicação |
| 40 | Transfer mid-fail | TX única | ≥1 owner |

## Ordem de locks recomendada (inalterada)

1. Idempotency gate  
2. Sale (se houver)  
3. InventoryBalance por `variant_id` ordenado  
4. Reservation  
5. Receivable/Installment/Payment  

Isolamento: Read Committed + locks explícitos suficientes para MVP; Serializable não necessário se locks ordenados.
