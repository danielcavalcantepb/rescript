# Operações Transacionais Controladas

> Sem SQL. Operações que exigem atomicidade / função de domínio+DB controlada.

---

## OP-ConfirmSale
| | |
|---|---|
| **Entradas** | sale_id, idempotency_key, payment_info?, actor |
| **Validações** | status pré-confirm; itens; desconto auth; entitlement; stock policy; version |
| **Locks** | InventoryBalance rows (variants) FOR UPDATE; Sale row |
| **Cria** | Movements exit; Payment?; Receivable/Installments; Outbox; Audit; StatusHistory |
| **Altera** | Sale→Confirmed; Reservations→Consumed; Balances; AvgCost unchanged on exit |
| **Idempotência** | idempotency_key |
| **Eventos** | SaleConfirmed, InventoryMoved, ReservationConsumed, ReceivableCreated… |
| **Falhas** | insufficient stock (policy); discount denied; concurrent confirm |

## OP-CancelSale
| | |
|---|---|
| **Entradas** | sale_id, reason, actor |
| **Efeitos** | reversal movements; cancel open receivables; require/create payment reversals; Sale→Canceled; Audit |
| **Locks** | Sale; balances; receivables |

## OP-ReserveStock / Release / Expire / Consume
- Consume tipicamente **dentro** de ConfirmSale
- Expire: job; status→expired; balance reserved↓
- Invariantes ReservationModel

## OP-RecordEntry / AdjustInventory
- Cria movement; recalc avg cost se entry com custo; audit obrigatório em adjust

## OP-RegisterPayment / ReversePayment
- Idempotency; allocations; recalc installment/receivable; audit

## OP-AuthorizeDiscount
- Cria DiscountAuthorization; não aplica sozinho sem SaleDiscount

## OP-AcceptInvite / TransferOwnership / RemoveMember
- Membership invariants; audit

## OP-ProcessImportBatch
- Aplica rows via serviços de domínio; idempotente; partial ok

---

## Padrão comum
1. Authorize + entitlement + tenant  
2. Begin TX  
3. Idempotency gate  
4. Ordered locks (Sale → variants sorted by id)  
5. Domain invariants  
6. Writes + outbox + audit  
7. Commit  
