---
Status: Active
Owner: Platform Engineering
Last-Reviewed: 2026-07-26
Version: 1.0.0
Type: Reference
Scope: platform / Observability
Supersedes: None
Superseded-By: None
Related-Modules: All
---

# Observability

Provider-agnostic ports in `#/platform/observability`:

- `LoggerPort`
- `AnalyticsPort`
- `ErrorReporterPort`
- `PerformancePort`

Current implementations are no-ops / console (`noop.ts`).

Wire Sentry (or similar) later by swapping ports — do not import vendors in feature modules.
