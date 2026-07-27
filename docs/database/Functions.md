---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / Functions
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Funções Lógicas (futuro no DB ou domínio controlado)

> Sem SQL. Catálogo do que provavelmente será função/RPC/serviço transacional.

| Função lógica | Equivale OP | Entrada chave | Notas |
|---|---|---|---|
| confirm_sale | ConfirmSale | sale_id, idem_key | FnOnly |
| cancel_sale | CancelSale | sale_id, reason | FnOnly |
| reserve_stock | Reserve | sale_id | |
| expire_reservations | Expire job | batch | |
| register_payment | RegisterPayment | installment, amount, key | FnOnly |
| reverse_payment | ReversePayment | payment_id, amount, key | FnOnly |
| record_stock_entry | RecordEntry | variant, qty, cost | |
| adjust_inventory | Adjust | variant, delta, reason | FnOnly |
| authorize_discount | AuthorizeDiscount | sale_id | |
| accept_invite | AcceptInvite | token | |
| transfer_ownership | TransferOwnership | to_user | FnOnly |
| commit_import | ProcessImport | job_id | |
| evaluate_insight_rule | worker | rule, org | assíncrono |

**Princípio:** app layer pode orquestrar desde que **mesma atomicidade** e gates; DB functions opcionais na fase física.
