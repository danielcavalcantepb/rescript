---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-27
Version: 1.0.0
Type: Canonical
Scope: Pricing domain, persistence, service, security and Workspace
Supersedes: None
Superseded-By: None
Related-Modules: Catalog, Product Variants, Permissions, Audit
---

# Pricing Foundation

Pricing is the sole owner of sale-price determination. Product and Product Variant provide identity; neither stores or calculates a sale price. Consumers resolve a price through the canonical Pricing Service and persist snapshots when their own domain contract requires one.

## Canonical model

- `PriceList` identifies an organization-scoped commercial table by immutable identity, unique code, currency, status and date validity.
- `PriceListItem` assigns a sale price and minimum price to one Product Variant for a non-overlapping validity interval.
- `price_history` is the append-only record of price changes.
- `pricing_search_projection` is the read-only operational projection for server-side search, filtering and pagination.

Money uses `numeric(19,6)` in PostgreSQL and decimal strings at application boundaries. Product, Variant and Inventory remain unchanged.

## Pricing Service

Input: organization, price-list ID, variant ID and instant.

Output: the single active item whose list and item intervals contain the requested instant. The service has no customer, channel, promotion, coupon, tax or automatic-discount fallback.

Absence of a valid item returns no price. Overlapping active intervals for the same organization, list and variant are rejected by a PostgreSQL exclusion constraint, including concurrent writes.

## Commands

Mutations are only available through permission-aware PostgreSQL commands:

- `create_price_list`
- `update_price_list`
- `archive_price_list`
- `create_price_list_item`
- `update_price_list_item`
- `remove_price_list_item`

Authenticated clients have no direct INSERT, UPDATE or DELETE grant on Pricing tables. Commands validate actor, membership, tenant, Variant ownership, status and monetary constraints before persisting, projecting and auditing in the same transaction.

## Queries

- `list_price_lists`: paginated lists with item count.
- `list_price_list_items`: paginated structured search by text, status, list, Product and Variant.
- `search_pricing_variants`: bounded Product/Variant picker.
- `resolve_price`: canonical explicit resolution.

All queries enforce `prices.read` or `prices.resolve` at the database boundary and are private, identity-dependent responses.

## Permissions

- `prices.read`
- `prices.create`
- `prices.edit`
- `prices.archive`
- `prices.restore`
- `prices.activate`
- `prices.resolve`

Owner and Admin have full access. Manager can manage Pricing. Seller, Inventory, Finance and Viewer receive read/resolve access according to the existing role presets. UI gates are convenience only; PostgreSQL commands are the security boundary.

## Audit and RLS

Central immutable `audit_event` records `PriceListCreated`, `PriceListUpdated`, `PriceListArchived`, `PriceListItemCreated`, `PriceListItemUpdated` and `PriceListItemRemoved`. Pricing tables and the projection are tenant isolated. Cross-tenant references and resolution fail at the server/database boundary.

## Workspace

The authenticated Workspace is `/catalog/pricing` and has:

- Tabelas: list registry, status, item count and update time.
- Itens: operational item search/filter and contextual item creation.
- Consulta: explicit Variant + Price List + date resolution.

No full dataset is loaded in the browser. List and item queries are paginated and filtered on the server.

## Explicitly out of scope

Promotions, coupons, cashback, commissions, taxes, customer/channel rules, Sales integration, contracts, automatic discounts, bulk changes and AI are not part of this foundation.
