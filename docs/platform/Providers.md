# Providers

## Order (outer → inner)

1. `AppSessionProvider` — Supabase Auth session
2. `GlobalErrorBoundary`
3. `OrganizationProvider`
4. `PermissionProvider` (depends on session + org)
5. `CommandBootstrap`
6. Hosts: `ToastViewport`, `DialogHost`

Defined in `apps/web/src/providers/app-shell-providers.tsx`.

## Session vs Organization

| Concern | Provider | Hook |
|---------|----------|------|
| Auth identity | AppSessionProvider | `useSession()` |
| Active org | OrganizationProvider | `useOrganization()` |
| Grants | PermissionProvider | `usePermission()` |

Session no longer exposes mock org or `hasPermission`.
