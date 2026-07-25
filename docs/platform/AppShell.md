# App Shell

## Responsibility

Owns layout chrome and cross-cutting runtime:

- Sidebar + Header (Topbar)
- Command Palette
- Providers composition
- Toasts + Dialogs
- Session (auth)
- Active organization
- Permissions
- Global error boundary

Business modules render **inside** `<main>` only.

## Composition

`AppSessionProvider` → `AppShellProviders` → routes.

`AppLayout` (authenticated `_app` route) hosts Sidebar, Topbar, and Command Palette.

## Do not

- Put org/permission logic inside feature pages.
- Create ad-hoc toasts via `alert()`.
- Import Lucide icons outside the catalog.
