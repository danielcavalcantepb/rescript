# Modelo Lógico — Outbox

---

## 1. OutboxMessage

| Campo | |
|---|---|
| id | = event_id |
| organization_id | |
| event_type | |
| aggregate_type, aggregate_id | |
| payload | JSON versionado |
| status | pending\|processing\|processed\|failed\|dead_letter |
| attempts, next_retry_at, last_error | |
| created_at, processed_at | |
| correlation_id, causation_id | |

Escrita **na mesma transação** do fato (ADR-0009).

---

## 2. Idempotência do consumidor
- ProcessedEvent(consumer_name, event_id) unique  
  ou handlers naturalmente idempotentes

---

## 3. Índices
- (status, next_retry_at) — polling
- (organization_id, created_at)
- (aggregate_type, aggregate_id)

---

## 4. Dead letter
Status dead_letter + alerta observabilidade; reprocesso manual.
