# Cobertura de Operações Transacionais

| Operação | Cenários | Dentro da TX (núcleo) | Após / async | Lacuna |
|---|---|---|---|---|
| OP-ConfirmSale | 08,09,10,32,41,55 | consume reservation, exit, avg cost capture, receivable, payment?, status, audit, outbox, idempotency | insights, fiscal, notificações | Draft path (41) |
| OP-CancelSale | 12,13,14 | release ou reversal movements; cancel open receivable; status | — | **orquestração payment (14)** |
| OP-ReserveStock | 07,10 | reservation items; balance reserved | — | — |
| OP-ExpireReservation | 11,51 | status expired; reserved↓ | — | Sale status (11) |
| OP-ReleaseReservation | 12,42 | reserved↓ | — | — |
| OP-RecordEntry | 03,18,19,50 | movement; avg recalc | — | físico=0 (50) |
| OP-AdjustInventory | 20 | movement; reason | — | vs reserved |
| OP-RegisterReturn | 21 | ? | ? | **não formalizada** |
| OP-RegisterPayment | 15,16,47 | payment+alloc; balances | — | external_ref |
| OP-ReversePayment | 17,14 | reversal payment | — | **parcial MVP** |
| OP-AuthorizeDiscount | 39 | authorization row | — | — |
| OP-ProcessImportBatch | 22–24 | rows batch | preview | conflict policy |
| OP-AcceptInvite | 02 | membership | — | — |
| OP-RemoveMember | 25 | membership inactive | orphan sales | — |
| OP-TransferOwnership | 40 | membership roles | — | two-phase |
| HandleWebhook | 30 | delivery dedup | — | futuro |
| EvaluateInsightRule | 28,29,53 | insight upsert | DC | cooldown |

## O que não pode falhar parcialmente

ConfirmSale, CancelSale (quando permitido), Reserve sob lock, RegisterPayment com alocação, TransferOwnership atômico, Expire idempotente.
