---
Status: Active
Owner: Architecture & Quality
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Historical
Scope: walkthrough / scenarios / 11-ExpiredReservation
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Cenário 11 — Reserva Expirada

## Cenário

Pedido com reserva ativa e TTL vencido; job de expiração executado **duas vezes**; reserva→Expirada; saldo reservado liberado; **sem** InventoryMovement.

### Objetivo
Validar expiração idempotente, FD-02, ReservationModel estados, e ausência de movimento físico.

### Atores
- Sistema (worker `ExpireReservations`)
- Vendedor (pedido esquecido)

### Estado inicial
Sale Pedido; Reservation active qty=5, expires_at ontem; físico=20, reservado=5, disponível=15.

### Pré-condições
- TTL configurado (**HYPOTHESIS:** org-configurable)
- Job agendado (cron/worker)

### Passos executados

#### 1. Primeira execução do job
1. **Comando:** `ExpireReservations` (batch por org, expires_at < now, status=active)
2. **Autorização:** sistema/internal
3. **Validações:** reservation ainda active; sale ainda Pedido (não confirmada)
4. **Consultadas:** InventoryReservation (org, status, expires_at index)
5. **Criadas:** nenhum InventoryMovement
6. **Alteradas:** Reservation→Expired; Sale→PedidoCancelado **ou** permanece Pedido com flag — **lacuna:** StateMachines liga expiração de orçamento; pedido expirado por TTL não tem estado terminal explícito além de liberação
7. **Locks:** row lock reservation + balance
8. **Auditoria:** expiração automática, motivo=TTL
9. **Eventos:** `ReservationExpired`, `InventoryReleased`
10. **Outbox:** insight "pedido parado/reserva expirada"
11. **Derivados:** reservado 5→0; disponível 15→20; físico=20
12. **Insight:** pedido parado / reserva expirada
13. **Falha:** confirmar sale expirada → deve falhar ou re-reservar
14. **Recuperação:** vendedor reabre pedido e re-reserva

#### 2. Segunda execução (idempotência)
1. **Comando:** `ExpireReservations` (reprocessamento)
2. **Autorização:** sistema
3. **Validações:** reservation já Expired → skip
4. **Consultadas:** status=Expired
5. **Criadas:** nenhuma
6. **Alteradas:** nenhuma
7. **Locks:** nenhum efeito
8. **Auditoria:** no-op log
9. **Eventos:** nenhum duplicado
10. **Outbox:** nenhum duplicado
11. **Derivados:** saldos estáveis
12. **Insight:** dedup N3
13. **Falha:** double-release → reservado negativo (bug)
14. **Recuperação:** invariante reserved ≥ 0

#### 3. Tentativa ConfirmSale pós-expiração
1. **Comando:** `ConfirmSale`
2. **Autorização:** `sales.confirm`
3. **Validações:** sem reserva active suficiente; disponível ok mas política pode exigir re-reserva
4. **Consultadas:** Reservation Expired
5. **Criadas:** nenhuma se falhar
6. **Alteradas:** nenhuma
7. **Locks:** n/a
8. **Auditoria:** falha registrada
9. **Eventos:** nenhum
10. **Outbox:** n/a
11. **Derivados:** n/a
12. **Insight:** n/a
13. **Falha:** estoque insuficiente se outro pedido consumiu disponível entretanto
14. **Recuperação:** renovar pedido/reserva

### Estado final esperado
Reservation Expired; reservado=0; disponível=20; físico=20; zero movimentos; job idempotente.

### Invariantes verificadas
I4 (expiração ≠ movimento), I3, G3; consumo de expired proibido (ReservationModel §5).

### Inconsistências encontradas
- **CONFLITO SIMULAÇÃO vs RN-34:** indireto — após expiração, corrida por disponível segue política block na sim.
- Estado Sale após TTL de pedido não nomeado em StateMachines (só OrçamentoExpirado explícito) — **decisão do fundador necessária:** PedidoExpirado vs. Pedido aberto sem reserva.
- Job falha parcial em batch: idempotência por reservation_id necessária.

### Ajustes recomendados
- Adicionar transição Pedido → PedidoExpirado ou auto-release mantendo Pedido editável.
- Métrica de reservas órfãs (ADR-0017 risco).

### Classificação
**aprovado com ressalvas**
