---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / Transactions
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Operações Transacionais Lógicas

> Ordem · dados · rollback · idempotência · eventos. Sem SQL.

**Padrão:** Authorize → Begin → Idempotency gate → Locks ordenados → Invariants → Writes + Audit + Outbox → Commit.

Ordem de locks: Idempotency → Sale → Balances (`variant_id` ASC) → Reservation → Receivable/Installment → Payment.

---

## OP-ConfirmSale

| | |
|---|---|
| **Altera** | Sale→Confirmada; Reservation→Consumed; Balance physical↓ reserved↓; AvgCost unchanged on exit |
| **Cria** | InventoryMovement(exit)+unit_cost_applied; Receivable+Installments; Payment?+Allocation?; SaleStatusHistory; Audit; Outbox; IdempotencyRecord |
| **Ordem** | lock → validate status/discount/stock → consume res → movements → receivable → payment? → sale status → outbox |
| **Rollback** | qualquer falha: zero efeitos |
| **Idempotência** | idempotency_key; replay resultado |
| **Eventos** | SaleConfirmed, InventoryMoved, ReservationConsumed, ReceivableCreated, PaymentRegistered? |
| **Async após** | insights, fiscal request, notificações |

## OP-CancelSale

| | |
|---|---|
| **Pré-confirm** | status terminal PedidoCancelado/Descartada…; Reservation→Released; sem movement; sem receivable |
| **Pós-confirm unpaid** | Sale→Cancelada; reversal movements; Receivable cancel; Audit; Outbox |
| **Pós-pago** | **FQ-01:** bloquear até ReversePayment **ou** orquestrar estorno na mesma TX |
| **Idempotência** | cancel key / status gate |
| **Eventos** | SaleCanceled, InventoryMoved(reversal), ReceivableCanceled, PaymentReversed? |

## OP-RegisterPayment / OP-ReversePayment

| | |
|---|---|
| **Altera** | saldos installment/receivable (DER); Payment status |
| **Cria** | Payment, Allocations; estorno cria Payment reverses_* |
| **Idempotência** | key + external_ref |
| **Eventos** | PaymentRegistered / PaymentReversed |
| **Parcial estorno** | FQ-02 |

## OP-ReserveStock / Consume / Release / Expire

| | |
|---|---|
| **Reserve** | cria Reservation+Items; reserved↑ available↓; **sem** movement |
| **Consume** | tipicamente dentro ConfirmSale |
| **Release/Expire** | reserved↓; status; sem movement; job expire idempotente |
| **Eventos** | Reservation* |

## OP-RecordEntry / AdjustInventory

| | |
|---|---|
| **Cria** | Movement; AvgCostLedger se entry c/ custo; recalc AverageCostCurrent |
| **Adjust** | motivo obrigatório; bloqueia se physical < reserved |
| **Eventos** | InventoryMoved |

## OP-ProcessImportBatch

| | |
|---|---|
| **Altera/Cria** | Customers/Products/Variants/Prices/Entries conforme rows |
| **Ordem** | por lote; partial ok |
| **Idempotência** | job key + row keys |
| **Rollback** | lote falho; não rollback global MVP |
| **Eventos** | ImportCompleted, entity created |

## OP-AcceptInvite / RemoveMember / TransferOwnership

| | |
|---|---|
| **Accept** | Membership active; Invite accepted |
| **Remove** | Membership inactive; authz imediata |
| **Transfer** | TX atômica: novo owner + demote antigo; ≥1 owner |
| **Eventos** | Member*, OwnershipTransferred |

## Troca de organização (contexto)

Não é TX de dados multi-org: valida Membership na org alvo; troca claim/contexto sessão; **nenhum** dado movido entre tenants.

---

## O que não pode falhar parcialmente

ConfirmSale · CancelSale (quando permitido) · Payment+Allocation · TransferOwnership · Expire (status gate).
