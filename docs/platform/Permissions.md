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

Import from the barrel `#/platform/permissions` (não misturar deep imports do mesmo símbolo):

```ts
import {
  PermissionProvider,
  usePermission,
  FeatureGate,
  RequirePermission,
  type PermissionStatus,
} from '#/platform/permissions'
```

- `PermissionProvider` → `SupabasePermissionRepository`
- `usePermission()` → `{ can, cannot, canAny, canAll, grants, isLoading, status, error }`
- `PermissionStatus`: `'loading' | 'ready' | 'error'` (não há status `'denied'`)
- Negação = `status === 'ready' && !can(key)`
- `PermissionGuard` / `PermissionBoundary` / `FeatureGate` / `RequirePermission`
- `ForbiddenState` / `PageError` → `#/platform/errors`
- `PageLoading` → `#/platform/loading`

## Load states (UI)

| Estado | UI |
|--------|----|
| `loading` (session / org / membership / grants) | `PageLoading` em boundaries; soft gates retornam `null` — nunca Forbidden nem conteúdo protegido |
| `ready` + `can(key)` | Conteúdo |
| `ready` + `!can(key)` | `ForbiddenState` |
| `error` | `PageError` |

`can()` returns `false` while not `ready`; pages must gate with `RequirePermission` / `PermissionBoundary`.

Custom roles, extra grants, restrictions, entitlements = future.
