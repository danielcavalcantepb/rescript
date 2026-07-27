---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 33-OutboxWorkerFailure
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 33 — Falha no Processamento da Outbox

## Cenário

Evento persistido; worker falha; retry; dead-letter; operação principal permanece válida.

### Objetivo
Outbox não é parte da consistência de negócio síncrona pós-commit.

### Atores
Outbox worker

### Estado inicial
Sale Confirmada; OutboxMessage pending `SaleConfirmed`.

### Pré-condições
Worker ativo.

### Passos executados

#### 1. Process falha
6. attempts++; status=pending; next_retry_at; last_error
Sale inalterada

#### 2. Exhaust retries
6. status=dead_letter; alerta ops
Insights dependentes podem atrasar — **não** invalidam Sale

#### 3. Replay manual
Reprocessa payload versionado; handlers idempotentes

### Estado final esperado
Núcleo consistente; outbox eventualmente processada ou DLQ visível.

### Invariantes verificadas
Principal op válida; handlers idempotentes.

### Inconsistências encontradas
Nenhuma.

### Ajustes recomendados
Monitoramento DLQ; nunca acoplar ConfirmSale a sucesso do worker.

### Classificação
**aprovado**
