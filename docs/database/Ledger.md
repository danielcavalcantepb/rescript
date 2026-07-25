# Ledgers

---

## 1. Ledger de estoque (MVP — FT)

**InventoryMovement** append-only.

| Aspecto | Regra |
|---|---|
| Origem | source_type + source_id obrigatórios (Sale, Adjust, Import, Return, Reversal…) |
| Compensação | novo movimento; **nunca** UPDATE/DELETE histórico |
| Reconstrução | somar movements → physical; reservations ativas → reserved |
| Custo | unit_cost_applied na saída imutável; média em AverageCost* |
| Auditoria | movement + AuditEvent em ajustes |
| Reserva | **fora** do ledger físico |

## 2. Ledger financeiro

| Camada | MVP | Futuro |
|---|---|---|
| Obrigação | Receivable + Installment | — |
| Liquidação | Payment + PaymentAllocation | — |
| Caixa append-only | **não obrigatório** | FinancialCashMovement / FinancialEntry |
| Contabilidade GL | **não** | FUT explícito |

**FinancialEntry** no briefing de Sale = sinônimo futuro de movimento de caixa; **não** criar como FT no MVP se Payment cobre o caso. Documentar fronteira para não acoplar Sale a GL.

## 3. Compensações

| Evento | Estoque | Financeiro |
|---|---|---|
| Cancel Sale confirmada | reversal movement | cancel receivable + reverse payments (FQ-01) |
| Estorno pagamento | — | Payment reversal + realloc |
| Devolução | return entry (FD-01.4) | FQ-03 |

## 4. Nunca editar histórico

Custo, qty, status passado de movement/payment valores — correção só compensatória.
