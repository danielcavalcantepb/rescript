---
Status: Active
Owner: Platform Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: platform / ArchitectureOverview
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Platform Foundation — Architecture Overview

## Purpose

Permanent application infrastructure so business modules (Organizations, Memberships, Customers, Products, Inventory, Sales, Finance) plug in **without structural refactors**.

## Layers

```
App Shell (layout + providers)
  ├── Session (Supabase Auth)
  ├── Organization (mock → real later)
  ├── Permissions (mock → real later)
  ├── Command Palette (registry)
  ├── Toast + Dialog hosts
  ├── Error Boundaries
  └── Business modules (routes / features)
```

## Rules

1. Business modules never own shell concerns (sidebar, session, org, permissions, toast, dialogs).
2. Permission checks use `resource.action` keys — never role names.
3. Organization and permissions stay mock until the Organizations + Memberships sprint.
4. No migrations, tables, RLS, or Edge Functions in this sprint.
5. Icons come from `#/platform/icons/catalog` — never import Lucide in feature code.
6. Design values come from CSS tokens in `styles.css`.

## Key directories

| Path | Responsibility |
|------|----------------|
| `apps/web/src/providers/` | AppSession + AppShellProviders |
| `apps/web/src/platform/organization/` | Org context (mock repo) |
| `apps/web/src/platform/permissions/` | Permission layer (mock repo) |
| `apps/web/src/platform/commands/` | Command registry + palette |
| `apps/web/src/platform/toast/` | Toast store + viewport |
| `apps/web/src/platform/dialogs/` | Confirm / delete / discard / danger / prompt |
| `apps/web/src/platform/errors/` | Boundaries + states |
| `apps/web/src/platform/loading/` | Skeletons / spinners |
| `apps/web/src/platform/empty/` | Empty state primitive |
| `apps/web/src/platform/icons/` | Icon catalog |
| `apps/web/src/platform/cache/` | Query key factory |
| `apps/web/src/platform/services/` | Logger, storage, date, currency, … |
| `apps/web/src/platform/observability/` | Ports (no vendor yet) |

## Persistence (Organizations sprint)

- `SupabaseOrganizationRepository` / `SupabasePermissionRepository` are the defaults.
- Keep `useOrganization()` / `usePermission()` APIs unchanged for business modules.
- See `docs/development/OrganizationsSetup.md`.

