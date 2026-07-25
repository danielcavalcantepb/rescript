# Máquinas de Estado — Fechamento sob PROPOSTAS

> Sem novos estados sem significado. Assume FDC aprováveis.  
> Detalhe completo permanece em `docs/domain/StateMachines.md` — este doc só fecha gaps.

---

## 1. Sale

Estados oficiais inalterados (FD-03). **Sem** PedidoExpirado (FDC-17).

| Transição | Comando | Ator | Permissão | Pré | Efeito | Evento | Falha | Idem |
|---|---|---|---|---|---|---|---|---|
| →Rascunho | CreateSale | vendedor | sales.create | org ativa | cria Sale | SaleCreated | entitlement | key opcional |
| Rascunho→Descartada | Discard | vendedor | sales.edit | rascunho | terminal; libera res | SaleDiscarded | — | status gate |
| Rascunho→Orçamento | IssueQuote | vendedor | sales.edit | itens válidos | quote_valid_until; **sem res** default | SaleQuoted | — | — |
| Orçamento→Pedido | AcceptToOrder | vendedor | sales.edit | orçamento | **reserva** | SaleOrdered | stock policy | — |
| Orçamento→Recusado/Expirado | Reject/Expire | user/system | edit/system | orçamento | terminal; libera res | … | — | job idem |
| Orçamento→Rascunho | Reopen | vendedor | sales.edit | orçamento | editável; libera res | SaleReopened | — | — |
| *→Confirmada | ConfirmSale | vendedor | sales.confirm | pré-confirm; discount ok; stock; **version** | consume/exit/receivable/pay? | SaleConfirmed | stock, authz, idem mismatch | **idem_key** |
| Pedido→PedidoCancelado | CancelOrder | vendedor | sales.cancel | Pedido | libera res | SaleOrderCanceled | — | status |
| Confirmada→Cancelada | CancelSale | vendedor | sales.cancel | Confirmada; **net payments=0** (FDC-04) | reversal stock; cancel recv | SaleCanceled | payments>0 | status |

---

## 2. Reservation

active → consumed | released | expired | canceled  

| Transição | Comando | Pré | Efeito | Idem |
|---|---|---|---|---|
| →active | Reserve | Pedido / policy | reserved↑ | unique source+variant |
| →consumed | ConfirmSale | active | reserved↓ physical↓ | na Confirm |
| →released | Cancel/Reopen | active | reserved↓ | status |
| →expired | ExpireJob | active ∧ now≥expires | reserved↓; Sale intacta | status gate |

---

## 3. InventoryMovement

Sem máquina de estados mutável — **append-only**. Tipos: entry, exit, adjustment_±, return, reversal. “Cancelar movement” = novo reversal.

---

## 4. Receivable / Installment

Status **preferencialmente derivados** de saldos/allocations (não digitados livres): Em aberto · Parcial · Quitado · Vencido (clock) · Cancelado (via CancelSale).

Transição Cancelado: só com CancelSale unpaid path.

---

## 5. Payment

pending → confirmed → reversed (MVP; via novo payment reversal)  
canceled / failed (integrações FUT)  
**partially_reversed:** existe no modelo para V1; **sem transição UX no MVP** (FDC-05).

| Comando | Pré | Efeito | Idem |
|---|---|---|---|
| RegisterPayment | amount≤saldo | confirmed+alloc | key+hash |
| ReversePayment | confirmed; amount=full líquido MVP | reversed + reversal pay | key+hash |

---

## 6. ImportJob

uploaded → mapping → previewing → committing → completed | completed_partial | failed  

Rollback: só discard antes de completed (FDC-15).

---

## 7. FiscalDocument / FiscalRequest (V1)

pending → submitted → issued | failed | canceled  

Não bloqueia Sale Cancelada no MVP (FDC-04). Idempotency provider_ref.
