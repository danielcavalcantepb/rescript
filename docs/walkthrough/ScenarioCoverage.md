# Matriz de Cobertura — Cenários

Legenda módulos: ID=Identity · CAT=Catálogo · INV=Estoque · RES=Reserva · SALE · FIN=Financeiro · INS=Insights · IMP=Import · SEC=Segurança · BILL=Billing · FIS=Fiscal · OUT=Outbox

| Cen | Módulos | Entidades principais | Ops TX | Eventos (ex.) | Riscos | Resultado |
|---|---|---|---|---|---|---|
| 01 | ID BILL CAT IMP SALE | User Org Membership StockLocation ImportJob Sale | Accept onboarding, Import, Confirm | OrgCreated… | onboarding incompleto | ressalva |
| 02 | ID SEC | Invite Membership Role | AcceptInvite RemoveMember | MemberJoined | IDOR org | ressalva |
| 03 | CAT INV | Product Variant Movement Balance AvgCost | RecordEntry | InventoryMoved | — | aprovado |
| 04 | CAT | Attribute Variant combination_hash | CreateVariant | — | anti-caos | ressalva |
| 05 | SALE | Sale SaleItem version | UpdateSale | — | optimistic lock | aprovado |
| 06 | SALE RES | Sale | Quote Reject Expire | SaleQuoted | OQ-03 | ressalva |
| 07 | SALE RES INV | Reservation Balance | ReserveStock | ReservationCreated | dup reserve | ressalva |
| 08 | SALE RES INV FIN OUT | Sale Movement Receivable Payment Outbox | **ConfirmSale** | SaleConfirmed… | atomicidade | ressalva |
| 09 | SALE | IdempotencyRecord | ConfirmSale | — | idem | aprovado |
| 10 | SALE RES INV | Balance Reservation | Reserve/Confirm | — | race stock | ressalva |
| 11 | RES | Reservation | ExpireReservation | ReservationExpired | Sale state | ressalva |
| 12 | SALE RES | Reservation | CancelOrder | — | — | aprovado |
| 13 | SALE INV FIN | Movement Receivable | CancelSale | — | compensação | aprovado |
| 14 | SALE FIN INV | Payment Sale | Cancel+Reverse? | — | **FQ-01** | decisão |
| 15 | FIN | Payment Allocation | RegisterPayment | — | overpay | ressalva |
| 16 | FIN | Payment Idempotency | RegisterPayment | — | dup | ressalva |
| 17 | FIN | Payment reverse | ReversePayment | — | **FQ-02** | decisão |
| 18 | INV | AvgCost Movement | RecordEntry | — | OQ-09 | ressalva |
| 19 | INV | Movement AvgCost | RecordEntry | — | margem | aprovado |
| 20 | INV | Movement | AdjustInventory | — | reserved | ressalva |
| 21 | INV FIN SALE | Return? Movement | RegisterReturn? | — | **FQ-03** | decisão |
| 22 | IMP CAT | ImportJob File | ProcessImport | — | partial | ressalva |
| 23 | IMP | ImportRow | ProcessImport | — | **FQ-04** | decisão |
| 24 | IMP CAT | Variant SKU | Create+Import | — | unique | aprovado |
| 25 | ID SALE | Membership Sale | Confirm | — | authz timing | ressalva |
| 26 | ID SALE | RolePermission | Confirm | — | authz | aprovado |
| 27 | BILL SALE | Subscription Org | Confirm blocked | — | matriz | ressalva |
| 28 | INS | Insight | EvaluateRule | InsightRaised | dedup | aprovado |
| 29 | INS | Insight/DataGap | EvaluateRule | — | false+ | aprovado |
| 30 | FIS FIN | WebhookDelivery | HandleWebhook | — | futuro | ressalva |
| 31 | FIS SALE | FiscalRequest | async | — | desacoplar | aprovado |
| 32 | SALE | IdempotencyRecord | ConfirmSale | — | HTTP | aprovado |
| 33 | OUT | OutboxMessage | worker | — | DLQ | aprovado |
| 34 | SEC | * | * | — | tenancy | aprovado |
| 35 | CAT SALE | Product archive | Archive | — | retenção | aprovado |
| 36 | CAT SALE | Customer snapshot | UpdateCustomer | — | freeze | ressalva |
| 37 | CAT SALE | Price SaleItem | UpdatePrice | — | **FQ-05** | decisão |
| 38 | CAT INV SALE | Quantity | Reserve Confirm | — | OQ-01/05 | ressalva |
| 39 | SALE ID | DiscountAuthorization | AuthorizeDiscount | — | OQ-04 | ressalva |
| 40 | ID | Membership Owner | TransferOwnership | — | atomic | ressalva |
| 41 | SALE INV | Sale | ConfirmSale | — | sem pedido | ressalva |
| 42 | SALE RES | Sale | ReopenQuote | — | — | aprovado |
| 43 | ID SALE | Membership | CreateSale | — | context | aprovado |
| 44 | SEC | SupportAccessGrant | — | — | scopes | ressalva |
| 45 | RES | Policy Reservation | UpdatePolicy | — | RN-92 | aprovado |
| 46 | CAT RES | Variant Reservation | Archive | — | block | ressalva |
| 47 | FIN | Installment | RegisterPayment | — | — | aprovado |
| 48 | SALE | Sale | CreateSale | — | policy | ressalva |
| 49 | SALE | IdempotencyRecord | Confirm | — | hash | ressalva |
| 50 | INV | AvgCost | RecordEntry | — | edge | ressalva |
| 51 | RES SALE | Reservation | Expire∥Confirm | — | race | aprovado |
| 52 | ID | Membership | Export | — | snapshot seller | ressalva |
| 53 | INS | Insight | Feedback | — | cooldown | ressalva |
| 54 | SEC | File | SignedURL | — | — | aprovado |
| 55 | BILL SALE | Entitlement | Confirm | — | matrix | ressalva |

## Não exercitados / cobertura fraca

| Área | Nota |
|---|---|
| Custom roles (FUT) | Fora MVP |
| PriceList / preço por cliente | FUT |
| Transferência entre locais | FUT |
| Juros/multa | FD-04 fora |
| GL contábil | FUT |
| Multi-currency FX | FD-07 |
| InventoryCount formal | Fronteira |
| Promoção/grandfathering detalhado | Entitlement parcial |
| Notificações push canal | Pouco exercitado |
| Anonimização LGPD job | Só retenção conceitual |
