---
Status: Active
Owner: Procurement Engineering
Last-Reviewed: 2026-07-27
Version: 1.0.0
Type: Canonical
Scope: Purchase Order foundation
Supersedes: Purchase lifecycle sections in legacy Procurement notes
Superseded-By: None
Related-Modules: Suppliers, Catalog, Pricing, Audit, Permissions
---

# Purchasing Foundation

Purchasing owns the commercial intention to acquire merchandise. It does not
receive goods, move stock, create ledger entries, create payables, or perform
fiscal operations.

## Aggregate

`PurchaseOrder` is the aggregate root. It owns header, immutable supplier
snapshot, totals, items and lifecycle. `PurchaseOrderItem` references one
Catalog variant and freezes its variant, unit and resolved price data.

New orders use the lifecycle:

`Draft → Sent → Confirmed → Closed`

`Draft`, `Sent` and `Confirmed` may be cancelled. `approved` remains accepted
only for backward compatibility with persisted orders and Goods Receiving.
Closing is administrative and has no cross-domain side effect.

## Pricing contract

Every new item requires an explicit Price List. Purchasing invokes the public
`resolve_price` Pricing Service contract and freezes its result. Purchasing
does not query Pricing tables, select a fallback list, accept a manual price,
or recalculate a price rule.

## Search projection

`purchase_search` is tenant-scoped and server-paginated. Its search document
contains order number, supplier, supplier document, product/variant snapshot,
SKU, description and notes. Filters remain status, supplier and period.

## Security

The canonical permissions are:

- `purchasing.orders.read`
- `purchasing.orders.create`
- `purchasing.orders.update`
- `purchasing.orders.cancel`
- `purchasing.orders.close`

Legacy `purchase.*` keys remain temporary application aliases. PostgreSQL RLS
enforces the canonical permissions and tenant membership. Application services
also validate permissions and lifecycle before repository access.

## Audit

History is append-only. Canonical actions include creation, update, sent,
confirmed, cancelled and closed. Supplier, variant and price snapshots preserve
the business context at the time of the command.

## Explicit exclusions

Receiving, stock entry, Inventory Ledger, Accounts Payable, fiscal documents,
XML, costs, quotations, requisitions, contracts and multilevel approval are
outside this foundation.
