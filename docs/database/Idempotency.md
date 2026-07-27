---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / Idempotency
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Idempotência

---

## 1. IdempotencyRecord

| Campo | Notas |
|---|---|
| organization_id | escopo |
| operation | confirm_sale, register_payment, … |
| key | cliente/gateway |
| request_hash | **obrigatório recomendado** (WT-14) |
| response_snapshot | resultado para replay |
| created_at | TTL opcional limpeza |

Unique (organization_id, operation, key).

## 2. Comportamento

| Caso | Resultado |
|---|---|
| Key nova | executa · grava |
| Key + mesmo hash | retorna snapshot |
| Key + hash diferente | **409 mismatch** — não executa |

## 3. Onde obrigatório

ConfirmSale · RegisterPayment · ReversePayment · Import commit · Webhook handle · TransferOwnership

## 4. Relação com unique natural

external_ref · sale confirmada status gate · reservation status — defesa em profundidade além da key.
