import { logger } from '#/platform/services/logger'
import type {
  AnalyticsPort,
  ErrorReporterPort,
  LoggerPort,
  PerformancePort,
} from '#/platform/observability/types'

export const observabilityLogger: LoggerPort = logger

export const analytics: AnalyticsPort = {
  track() {
    /* no-op until provider */
  },
}

export const errorReporter: ErrorReporterPort = {
  capture({ error, context }) {
    logger.error('Captured error', {
      message: error instanceof Error ? error.message : String(error),
      ...context,
    })
  },
}

export const performance: PerformancePort = {
  mark() {
    /* no-op until provider */
  },
}
