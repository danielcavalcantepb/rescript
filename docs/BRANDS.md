---
Status: Active
Owner: Catalog Team
Last-Reviewed: 2026-07-27
Version: 1.0.0
Type: Canonical
Scope: Catalog brands
Supersedes: None
Superseded-By: None
Related-Modules: Catalog, Products, Search
---

# Brands

Brand is an organization-scoped Catalog classification with identity, name, normalized name, slug, description, status, sort order and audit metadata. Name and slug are unique within the organization.

Commands support create, update, archive, get and list. A Brand referenced by a non-archived Product cannot be archived. Reads require `catalog.brands.read`; mutations require `catalog.brands.write`; RLS and server authorization apply independently.

Logo storage, files, commercial metrics and supplier relationships are not part of Brand in this foundation.
