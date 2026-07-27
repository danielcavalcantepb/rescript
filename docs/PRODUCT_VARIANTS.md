---
Status: Active
Owner: Catalog Team
Last-Reviewed: 2026-07-27
Version: 1.0.0
Type: Canonical
Scope: Product and Product Variant contract
Supersedes: None
Superseded-By: None
Related-Modules: Catalog, Pricing, Inventory, Sales
---

# Product Variants

Product owns family identity, description, Brand, primary Category, topology, lifecycle and Variants. Product does not own SKU, barcode, price or inventory balance.

Product Variant is the identifiable and sellable unit. It owns SKU, barcodes, unit of measure, attribute assignments, combination hash, default marker, inventory-tracking intent and lifecycle. SKU and non-empty barcode are unique within an organization.

A simple Product must have one default Variant. A variable Product must have declared axes and one or more valid option combinations. Database constraints guarantee same-organization Product/Variant relationships and valid Attribute Option assignments.

`catalog.products.*` and `catalog.variants.*` are the canonical permissions. Existing legacy `products.*` grants remain accepted during compatibility cutover. Price resolution stays in Pricing and stock remains in Inventory.

Initial inventory, Product plus Price atomic composition, images and new product topologies are explicitly deferred.
