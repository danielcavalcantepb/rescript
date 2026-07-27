---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 51-ConcurrentExpireAndConfirm
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 51 — Expirar Reserva vs Confirmar (Corrida) (exploratório)

## Cenário

Job de expiração e ConfirmSale simultâneos na mesma Reservation.

### Objetivo
Locks/ordenação; um vence; invariantes.

### Atores
Expire job; Vendedor

### Estado inicial
Reservation active perto do TTL; Sale Pedido.

### Passos executados

#### 1. Corrida
7. Ambos lock Reservation/Balance ordenados
- Confirm vence: consume→exit; expire vê status≠active → no-op idempotente
- Expire vence: status expired; available restaurado; Confirm falha insufficient **ou** re-reserva se policy (não recomendado na mesma request)

### Estado final esperado
Sem reserved negativo; sem double exit.

### Invariantes verificadas
Reservation states; estoque.

### Inconsistências encontradas
Mensagem UX se expire ganhar durante clique confirmar.

### Ajustes recomendados
Expire e Confirm usam mesmo lock order; expire só se status=active AND now≥expires_at.

### Classificação
**aprovado**
