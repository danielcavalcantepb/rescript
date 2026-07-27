---
Status: Active
Owner: Platform Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: platform / Permissions
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Permissions

## Convention

Keys are `resource.action` only. Never check role names in UI.

## Inventory

Inventory utiliza permissões específicas por operação: leitura
(`inventory.read` e `inventory.movements.read`), entrada/saída manual
(`inventory.movements.create`), ajuste (`inventory.adjust`), transferência
(`inventory.transfer`) e estorno (`inventory.reverse`). Conceder criação de
movimento não implica transferência; conceder ajuste não implica estorno.
`inventory.move` permanece apenas como alias legado de
`inventory.movements.create` e não deve aparecer em novos presets ou contratos.

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
