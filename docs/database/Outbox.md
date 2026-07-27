---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / Outbox
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Outbox (modelo lógico)

> Detalhe complementar a `OutboxModel.md`.

---

## 1. Estrutura lógica

OutboxMessage: id · organization_id · event_type · payload_version · payload · aggregate_type · aggregate_id · aggregate_version? · status · attempts · next_retry_at · last_error · correlation_id · causation_id · occurred_at · created_at · processed_at

## 2. Quando persistir

| Critério | Outbox? |
|---|---|
| Efeito colateral após commit (insight refresh, email, fiscal, webhook out) | sim |
| Só UI local | não |
| Já coberto por Audit | audit ≠ outbox |
| Dentro da TX do fato | **sim, mesma TX** |

## 3. Ordem

FIFO aproximado por aggregate quando necessário; workers com `SKIP LOCKED` (fase SQL).

## 4. Retries / DLQ

Backoff · max attempts · status=dead_letter · alerta ops · replay manual idempotente.

## 5. Idempotência do handler

Handlers devem tolerar redelivery (usar event id / aggregate version).

## 6. Falha do worker

Operação principal **permanece válida** (walkthrough 33).
