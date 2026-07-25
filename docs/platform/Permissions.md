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
- `usePermission()` → `{ can, cannot, canAny, canAll, grants, isLoading, status, error }`
- `status`: `loading` | `ready` | `error`
- `PermissionGuard` / `PermissionBoundary` / `FeatureGate` / `RequirePermission`

## Load states (UI)

| Estado | UI |
|--------|----|
| Session / org / grants unresolved (`isLoading`) | Platform `PageLoading` — never Forbidden |
| `ready` + allowed | Conteúdo |
| `ready` + denied | `ForbiddenState` |
| `error` | `PageError` |

`can()` returns `false` while unresolved; pages must gate with `RequirePermission` / `PermissionBoundary` so Forbidden only appears after resolution.

Custom roles, extra grants, restrictions, entitlements = future.
