---
Status: Active
Owner: Platform Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: platform / ErrorHandling
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Error Handling

## Components

- `GlobalErrorBoundary` — React boundary; reports via `errorReporter`
- `PageError` / `UnexpectedErrorState`
- `UnauthorizedState`
- `ForbiddenState`
- `OfflineState`
- Retry + Recover actions

## Observability hook

`errorReporter.capture({ error, context, tags })` — currently logs; ready for Sentry later.

Router `errorComponent` uses `PageError`.
