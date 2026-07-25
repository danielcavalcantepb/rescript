# Observability

Provider-agnostic ports in `#/platform/observability`:

- `LoggerPort`
- `AnalyticsPort`
- `ErrorReporterPort`
- `PerformancePort`

Current implementations are no-ops / console (`noop.ts`).

Wire Sentry (or similar) later by swapping ports — do not import vendors in feature modules.
