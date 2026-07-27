---
Status: Active
Owner: Product & Architecture
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Canonical
Scope: Canonical product, domain, architecture, and UI terminology
Supersedes: Multiple distributed glossaries as authority
Superseded-By: None
Related-Modules: All
---

# Glossary

This glossary controls terminology. Specialized glossaries may add detail but cannot redefine these terms.

| Term | Canonical meaning |
|---|---|
| Aggregate | Consistency boundary that protects invariants through an aggregate root |
| Allocation | Application of all or part of a Payment to a financial installment |
| Append-only | Persistence model where correction occurs through compensating records, not mutation or deletion |
| Audit Event | Immutable, actor-centered record of a sensitive or relevant action |
| Bounded Context | Domain boundary owning its vocabulary, rules, and canonical data |
| Canonical Data | Authoritative fact owned by one module |
| Cash Account | Financial destination or source representing a bank account or physical cash; not yet implemented |
| Central | Operational home that prioritizes decisions, exceptions, and next actions |
| Command | Intent to change state; must pass authorization and domain validation |
| Command Palette | Global keyboard-accessible search and action surface |
| Compensating Record | New immutable record that reverses the effect of an earlier ledger fact |
| Customer | Party buying from the organization; owned by CRM/Customers |
| Domain Event | Immutable fact emitted after a domain transition |
| Entity | Domain object with stable identity and lifecycle |
| Financial Ledger | Append-only financial facts from which realized cash can be reconstructed; target architecture |
| Goods Receipt | Receipt of goods against an approved purchase order; product label is “Recebimento” |
| Idempotency | Repeating the same operation with the same key and payload produces no duplicate effect |
| Installment | Dated subdivision of an amount payable or receivable |
| Ledger | Immutable sequence of business facts used as the source for balances and projections |
| Lifecycle | Explicit valid states and transitions of an aggregate or entity |
| Membership | Relationship between an authenticated user and an Organization, including status and role preset |
| Module | Vertical implementation of a bounded capability across domain, application, infrastructure, and UI |
| Organization | Tenant and primary isolation boundary |
| Payment | Financial settlement event. Incoming versus outgoing scope must be explicit; the full module is planned |
| Permission | Stable `resource.action` capability checked independently of role names |
| Policy | Domain rule deciding whether an action is allowed or how it must be performed |
| Port | Contract used across boundaries without importing another module's persistence |
| Projection | Rebuildable read model optimized for a query or user surface |
| Purchase Order | Procurement aggregate representing a supplier order; product label is “Pedido de compra” |
| Query | Read operation that does not change authoritative state |
| Receivable | Right to receive money, normally originating from a confirmed Sale |
| Repository | Port that loads and persists aggregates within their owning module |
| Reversal | Explicit compensation of a posted immutable financial or inventory fact |
| RLS | PostgreSQL Row Level Security enforcing tenant isolation at the database boundary |
| RPC | Typed application entry point or database function used for an operation requiring a stable/atomic boundary |
| Sale | Commercial aggregate; payment state is not stored as a boolean on Sale |
| Snapshot | Immutable copy of historical business data captured at a lifecycle boundary |
| Supplier | Party supplying the organization; owned by Suppliers/Procurement, not Catalog |
| Tenant | Organization whose data and operations are isolated from every other Organization |
| Value Object | Immutable domain value defined by its attributes and validation, such as Money |
| Workspace | Context-rich surface for an important entity or operational area, combining status, summary, relationships, history, and actions |

## Product labels versus technical names

| Technical/context name | Product label |
|---|---|
| CRM / Customers | Clientes |
| Procurement | Compras |
| Goods Receipt / Receiving | Recebimentos |
| Catalog Product | Produto |
| Accounts Payable | Contas a pagar |
| App home | Central |

## Usage rules

- Use English for code, schemas, events, and file paths.
- Use Brazilian Portuguese operational language in the UI.
- Never use “paid” as a standalone stored boolean for financial settlement.
- Never call a projection or cache a ledger/source of truth.
- Never use “Workspace” for a simple form or navigation card wall.
