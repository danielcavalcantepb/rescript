# Permissions

## Convention

Keys are `resource.action` only. Never check role names in UI.

## Source of grants

1. Load active `membership` for `(organization_id, user_id)`
2. Read preset `role`
3. Expand via `permissionsForRole(role)` from `@rescript/permissions`

## Presets

`owner` · `admin` · `manager` · `seller` · `inventory` · `finance` · `viewer`

## API

- `PermissionProvider` → `SupabasePermissionRepository`
- `usePermission()` → `{ can, cannot, canAny, canAll, grants, isLoading }`
- `PermissionGuard` / `PermissionBoundary` / `FeatureGate`

Custom roles, extra grants, restrictions, entitlements = future.
