---
Status: Active
Owner: Catalog Team
Last-Reviewed: 2026-07-27
Version: 1.0.0
Type: Canonical
Scope: Dynamic catalog attributes
Supersedes: None
Superseded-By: None
Related-Modules: Catalog, Product Variants, Search
---

# Attributes

Attribute Definition provides reusable organization-scoped metadata without fixed columns such as color or size. The persisted types remain the established `option`, `text`, `decimal`, `boolean` and `date` contract. In product language, `option` represents selection, `decimal` represents number and color is an option rendered with color semantics; no parallel type system is introduced.

Definitions contain name, normalized name, value type, variant-axis flag, filterable flag, sort order and status. Only `option` attributes can be variant axes. Attribute Options contain label, normalized label, sort order and status and are unique within their definition.

Variant assignments are same-tenant constrained. An Option must belong to the assigned Definition, and a Variant can assign a Definition only once. Used definitions and options cannot be silently removed; archive is allowed only when integrity remains intact.

Reads require `catalog.attributes.read`; mutations require `catalog.attributes.write`. The `/catalog/attributes` Workspace uses the canonical commands and projection. Multiselect and semantic attributes remain outside scope.
