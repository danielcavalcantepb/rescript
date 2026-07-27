---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / Concurrency
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Concorrência

---

## 1. Mecanismos

| Mecanismo | Onde |
|---|---|
| Optimistic locking (`version`) | Sale pré-confirm; Membership opcional |
| Pessimistic row lock | InventoryBalance; Reservation; Installment no pay; Sale no confirm |
| Unique constraints | SKU, idempotency, fingerprint |
| IdempotencyRecord | Confirm, Payment, Import, Webhook |
| Ordered locks | evita deadlock |
| Retry | outbox, webhooks; **não** retry cego Confirm sem key |

---

## 2. Cenários

| Cenário | Defesa |
|---|---|
| Double click Confirm | mesma idempotency_key |
| Dois vendedores mesmo estoque | lock balances; um falha se insuficiente (policy) |
| Expire ∥ Confirm | lock reservation; status gate |
| Pagamento duplicado | key + external_ref |
| Webhook dup | (provider, event_id) |
| Edit Sale ∥ Confirm | version / status |
| Import ∥ create SKU | unique (org,sku) |
| Ajuste ∥ venda | lock balance |
| Member removed mid-op | recheck membership início TX |
| Jobs concorrentes outbox | lease/skip locked pattern (fase SQL) |

---

## 3. Deadlock

Prevenir com ordem global de locks. Se ocorrer: abort + retry idempotente.

## 4. Isolamento

**Recomendação:** Read Committed + locks explícitos (suficiente MVP). Serializable só se medido necessário — não default.

## 5. Duplicidade / requisições repetidas

Sempre preferir idempotency key do cliente + stored result hash (walkthrough 49).
