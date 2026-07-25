# Organizations + Memberships Setup

## Overview

First persistence sprint: multi-tenant foundation with `organization` + `membership`, RLS, and RPC `create_organization`.

See also: [OrgMembershipInconsistencies.md](./OrgMembershipInconsistencies.md), [Migrations.md](./Migrations.md), [RLSTesting.md](./RLSTesting.md).

## Schema

| Table | Purpose |
|-------|---------|
| `organization` | Tenant root (`name`, `slug`, `status`, `currency=BRL`, audit fields, `version`) |
| `membership` | User↔org (`role` preset, `status`, `is_owner`, unique active pair) |

No business tables. Permission catalog remains in `@rescript/permissions` (code).

## Roles (presets)

`owner` · `admin` · `manager` · `seller` · `inventory` · `finance` · `viewer`

Mapped via `ROLE_PERMISSIONS` → `resource.action` keys. UI must use `can('…')`, never `role ===`.

## Active organization

- **Storage:** `localStorage` key `rescript.activeOrganizationId`
- **Authority:** preference only — every load validates an **active membership** on an **active** organization
- Cleared on logout
- Documented trade-off: simplest for this phase; future optional `active_organization_preference` table

## Onboarding

1. Login  
2. No active membership → `/onboarding`  
3. `create_organization(name)` RPC (atomic org + owner membership)  
4. Preference set to new org → Central `/`

Double-click / retry: transaction advisory lock on `auth.uid()`.

## RPC `create_organization`

- `SECURITY DEFINER` + `search_path = public`
- Uses `auth.uid()` only (ignores client user_id/role)
- Why definer: bootstrap — membership required for RLS, but membership does not exist yet

## Client architecture

- `SupabaseOrganizationRepository` / `SupabasePermissionRepository`
- Mocks removed
- Contexts unchanged: `useOrganization()`, `usePermission()`

## Audit (this sprint)

Timestamps + `created_by` on both tables. Full audit log table = future Audit migration (not faked here).

## Limitations

- No invites, custom roles, transfer ownership UI, StockLocation seed, billing
- Git remote not configured (critical before deploy)
- Types hand-maintained until `supabase gen types` is linked

## Apply migration

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

Or run `supabase/migrations/20260725010000_organizations_memberships.sql` in the Supabase SQL editor (project matching `.env.local`).
