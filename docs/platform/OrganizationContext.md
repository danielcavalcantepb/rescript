---
Status: Active
Owner: Platform Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: platform / OrganizationContext
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Organization Context

## API

- `OrganizationProvider` (default: `SupabaseOrganizationRepository`)
- `useOrganization()` → `{ organizations, currentOrganization, isLoading, error, switchOrganization, createOrganization, reload }`
- `OrganizationSwitcher`
- Types: `Organization`, `CurrentOrganization`, `Membership`

## Active organization

Preference in `localStorage` (`rescript.activeOrganizationId`), validated against active memberships on every load. Suspended orgs are not selectable.

## Persistence

Real Supabase tables `organization` / `membership` + RPC `create_organization`.  
Mocks removed. See `docs/development/OrganizationsSetup.md`.
