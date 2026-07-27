---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 45-ReservationTTLConfigChange
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 45 — Mudança de TTL de Reserva (exploratório)

## Cenário

Org altera TTL padrão; reservas já ativas mantêm expires_at original (RN-92).

### Objetivo
Config afeta futuro, não reescreve histórico/compromissos.

### Atores
Admin

### Estado inicial
Reservation expires_at=T1; policy TTL 72h→24h.

### Passos executados

#### 1. Update ReservationPolicy TTL
6. Policy nova; reservas existentes **inalteradas**
#### 2. Nova reserva
expires_at conforme novo TTL

### Estado final esperado
Sem reescrever expires_at antigos silenciosamente.

### Invariantes verificadas
RN-92.

### Inconsistências encontradas
Nenhuma.

### Ajustes recomendados
Opcional comando “recalcular TTLs abertos” explícito e auditado — fora do default.

### Classificação
**aprovado**
