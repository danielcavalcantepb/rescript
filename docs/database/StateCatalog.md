---
Status: Active
Owner: Data Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: database / StateCatalog
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Catálogo de Estados e Enums Lógicos

| Conceito | Valores | Representação recomendada |
|---|---|---|
| Organization.status | active, suspended, canceled, anonymized | **enum rígido** |
| Membership.status | invited, active, suspended, removed | enum rígido |
| Invite.status | pending, accepted, rejected, expired, revoked | enum rígido |
| Sale.status | draft, quote, order, confirmed, canceled, discarded, quote_rejected, quote_expired, order_canceled | **enum rígido** (máquina crítica) |
| Reservation.status | active, consumed, released, expired, canceled | enum rígido |
| Movement.type | entry, exit, adjustment_plus, adjustment_minus, return, reversal | enum rígido |
| Receivable.status | open, partially_settled, settled, canceled | enum rígido / derivado parcial |
| Installment.status | open, partial, paid, overdue, canceled | overdue **derivado** |
| Payment.status | pending, confirmed, partially_reversed, reversed, canceled, failed | enum rígido |
| Insight.status | active, dismissed, resolved, expired | enum rígido |
| Insight.nature | fact, projection, recommendation | enum rígido |
| Insight.severity | info, attention, critical | enum rígido |
| ImportJob.status | uploaded…reverted | enum rígido |
| Subscription.status | trial, active, past_due, suspended, canceled | enum rígido |
| FiscalDocument.status | pending…canceled | enum rígido |
| Payment.method | cash, pix, card, boleto, other | enum **extensível** (tabela ref ou check + open) |
| Customer.type | PF, PJ, unknown | enum |
| Unit codes | un, kg… | tabela ref híbrida |
| Permission keys | sales.confirm… | catálogo plataforma |
| Attribute names | cor, tamanho… | **não** enum — dados por produto |

### Regras
- Estados de máquina crítica → enum rígido controlado pelo sistema.
- Métodos de pagamento / categorias → extensíveis com disciplina.
- Não transformar atributos de variante em enum global.
