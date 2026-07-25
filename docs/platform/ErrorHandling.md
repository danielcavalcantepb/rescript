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
