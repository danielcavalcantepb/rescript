---
Status: Active
Owner: Catalog Team
Last-Reviewed: 2026-07-27
Version: 1.0.0
Type: Canonical
Scope: Catalog categories
Supersedes: None
Superseded-By: None
Related-Modules: Catalog, Products, Search
---

# Categories

Category classifies Products within one organization. Its canonical fields are identity, organization, parent, name, normalized name, slug, description, status, sort order, depth and audit timestamps/actors.

The hierarchy supports at most five levels. Both the domain and PostgreSQL prevent cycles, cross-tenant parents and descendants beyond that limit. Moving a node recalculates descendant depth. A category with active children or non-archived Products cannot be archived.

Commands support create, update, move, archive, get and list. Reads are protected by `catalog.categories.read`; mutations require `catalog.categories.write`. RLS is always active for application access.

The Workspace at `/catalog/categories` uses the same application service as Product references. Infinite hierarchy, images and category analytics remain out of scope.
