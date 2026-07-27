---
Status: Active
Owner: Architecture & Engineering
Last-Reviewed: 2026-07-27
Version: 1.0.0
Type: Canonical
Scope: Catalog domain foundation
Supersedes: None
Superseded-By: None
Related-Modules: Products, Variants, Categories, Brands, Attributes, Search
---

# Catalog Foundation

Catalog is the bounded context that identifies and classifies what the organization sells. It owns Product, Product Variant, Category, Brand, Attribute Definition, Attribute Option and the assignment of options to variants.

Product is the family aggregate root. Product Variant is the identifiable and sellable unit. Pricing, Inventory and Suppliers remain separate domains and are referenced through their existing contracts; they are not embedded in Catalog.

## Canonical topology

Only `simple` and `variable` products are supported. A simple product has exactly one default variant. A variable product has one or more variants whose attribute assignments use declared Product axes. Automatic combination generation is an existing application capability, not a database side effect.

SKU and barcode belong to Variant. Price belongs to Pricing. Balance belongs to Inventory. Supplier remains outside Catalog under the current ADRs.

## Integrity

- Every persisted entity is scoped by `organization_id`.
- Product references Category and Brand from the same organization.
- Variant references Product from the same organization.
- Attribute Option belongs to its Attribute Definition.
- A Variant cannot assign the same Attribute Definition twice.
- Category hierarchy is cycle-safe and limited to five levels under the current contract.
- Archive replaces destructive deletion when an entity is referenced.
- Slugs are unique per organization.

## Operational projection

`catalog_search_projection` is a derived, rebuildable row per Variant. It contains Product, Variant, SKU, barcodes, Category, Brand, statuses and JSON attribute assignments. It deliberately excludes price, balance, supplier, sales and analytics facts.

## Security and audit

RLS is enabled for the foundation tables and projection. Same-organization composite foreign keys prevent cross-tenant references. Server commands validate membership and canonical `catalog.*` permissions. `catalog_history` is append-only and is written by database triggers for taxonomy and assignment changes.

## Current limits

Images, fiscal data, supplier ownership, initial inventory, transactional Pricing composition, semantic search, analytics, advanced logistics, service/kit/raw-material topologies and autosave are outside this foundation.

See [Categories](./CATEGORIES.md), [Brands](./BRANDS.md), [Attributes](./ATTRIBUTES.md), [Product Variants](./PRODUCT_VARIANTS.md), and [Module Status](./MODULE_STATUS.md).
