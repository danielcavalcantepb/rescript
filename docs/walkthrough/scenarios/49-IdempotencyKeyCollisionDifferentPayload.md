---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 49-IdempotencyKeyCollisionDifferentPayload
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 49 — Colisão de Idempotency Key com Payload Diferente (exploratório)

## Cenário

Mesma key, body diferente → rejeitar; não retornar resultado anterior cegamente.

### Objetivo
Segurança de idempotência.

### Atores
Cliente API

### Estado inicial
K1 associada a ConfirmSale sale=S1.

### Passos executados

#### 1. Retry ConfirmSale S2 com K1
3. Hash payload ≠ stored → **409 idempotency_payload_mismatch**
5. Sem efeitos
14. Usar nova key

### Estado final esperado
S1 intacto; S2 não confirmado por engano.

### Invariantes verificadas
Idempotência correta.

### Inconsistências encontradas
Necessity de armazenar request_hash no IdempotencyRecord — deve estar no modelo.

### Ajustes recomendados
Campo request_hash obrigatório no IdempotencyRecord.

### Classificação
**aprovado com ressalvas**
