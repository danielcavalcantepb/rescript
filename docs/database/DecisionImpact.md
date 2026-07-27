---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / DecisionImpact
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Impacto das Decisões Pendentes no Modelo Lógico

> **Não altera** o modelo silenciosamente. Mapeia o que muda **quando** o fundador aprovar cada FDC.  
> Fonte: `docs/decisions/FounderDecisionClosure.md`.

| FDC | Entidades | Atributos | Rels | Constraints | Índices | Transações | RLS | Eventos | Retrabalho se adiar pós-schema |
|---|---|---|---|---|---|---|---|---|---|
| FDC-01 Money | Payment, SaleItem, Price*, AvgCost*, Receivable | amount types | — | money checks | — | arredondamento nas OPs | — | — | **Alto** (migração tipo) |
| FDC-02 AvgCost | AverageCostCurrent/Ledger | PK lógica + location_id | location | unique key | unique (org,loc,var) | recalc entry | — | AverageCost* | **Alto** |
| FDC-03 Location | StockLocation | sempre presente | all inv | NOT NULL location | compostos c/ loc | todas inv ops | org | — | **Alto** se omitir coluna |
| FDC-04 Cancel paid | Sale, Payment, Receivable | flags/guards | — | net pay=0 pré-cancel | — | CancelSale, ReversePayment | perms | SaleCanceled after reverse | **Alto** (API OP) |
| FDC-05 Estorno parcial | Payment | status enum values | — | ban partial MVP | — | ReversePayment só full | — | — | Médio (enum) |
| FDC-06 Return | InventoryMovement | type=return | source Sale | qty≤sold | source idx | RegisterReturn leve | return perm | InventoryReturned | Médio |
| FDC-07 FinancialEntry | **não criar** Entry | — | remover refs FUT | — | — | Payment only | — | — | **Alto** se criar Entry agora e depois remover |
| FDC-08 Idempotency | IdempotencyRecord | request_hash NOT NULL | — | unique+hash | (org,op,key) | todas idem ops | — | — | Médio |
| FDC-09 Qty/Round | UnitOfMeasure, Quantity cols | precision, rounding_policy | — | scale checks | — | validate qty | — | — | Médio |
| FDC-10 Neg stock | OrganizationPolicy | stock.negative_mode | — | — | — | Confirm/Reserve messages | — | — | Baixo (policy) |
| FDC-11 TTL | OrganizationPolicy, Reservation | default_ttl, expires_at | — | — | expire idx | Expire job | — | — | Baixo |
| FDC-12 Quote res | OrganizationPolicy | quote_reserves | — | — | — | Quote transition | — | — | Baixo |
| FDC-13 Discount | DiscountPolicy, SaleDiscount, DiscountAuthorization | limits | — | self-auth | — | AuthorizeDiscount | discount perms | Discount* | Médio |
| FDC-14 Price freeze | SaleItem | unit_price imutável regra | — | — | — | AddItem/SyncPrices | — | — | Baixo schema / Alto UX |
| FDC-15 Import | ImportJob/Row | conflict_mode | — | no delete used | idem | CommitImport | imports.run | Import* | Médio |
| FDC-16 Unit conv | — | sem factor tables | — | — | — | — | — | — | Baixo se não criar agora |
| FDC-17 Order expire | Reservation, Sale | sem novo status | — | — | — | Expire, Confirm | — | ReservationExpired | **Alto** se criar PedidoExpirado e reverter |
| FDC-18 Ownership | Membership | — | — | ≥1 owner | — | TransferOwnership | — | OwnershipTransferred | Médio |
| FDC-19 Confirm draft | Sale, Reservation | reservation optional | — | — | — | ConfirmSale | — | — | Baixo |
| FDC-20 Avg0 | AverageCost* | fórmula | — | — | — | RecordEntry | — | — | Baixo |
| FDC-21 Archive/Adjust | Variant, Balance | — | — | reserved guards | — | Archive, Adjust | — | — | Baixo |
| FDC-22 Attr lock | Variant | combination_hash imutável | — | — | — | UpdateVariant | — | — | Baixo |

## Após aprovação — docs a atualizar (não agora)

FounderDecisions (esclarecimentos) · OpenQuestions (fechar) · BusinessRules (RN attr) · StateMachines · TransactionalOperations · PaymentsModel · Ledger · MVP.md (caixa/devolução) · DecisionCenter copy · SaleSnapshots · ImportModel · DiscountModel · AverageCostModel · AuthorizationDataModel · walkthrough FounderQuestions · screens SaleDetail/Import/Organization
