/** Provider-agnostic observability contracts — wire Sentry/etc. later. */

export type AnalyticsEvent = {
  name: string
  properties?: Record<string, unknown>
}

export type ErrorReport = {
  error: unknown
  context?: Record<string, unknown>
  tags?: Record<string, string>
}

export type PerformanceMark = {
  name: string
  durationMs?: number
  meta?: Record<string, unknown>
}

export interface LoggerPort {
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
}

export interface AnalyticsPort {
  track(event: AnalyticsEvent): void
}

export interface ErrorReporterPort {
  capture(report: ErrorReport): void
}

export interface PerformancePort {
  mark(mark: PerformanceMark): void
}
