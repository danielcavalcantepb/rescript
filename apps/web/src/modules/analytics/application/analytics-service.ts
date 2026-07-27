import { buildAnalyticsSnapshot } from '../domain/engine'
import type { AnalyticsQuery, AnalyticsWorkspaceSnapshot } from '../domain/types'
import type { AnalyticsAppDeps } from './deps'
import { AnalyticsPermissionError } from './errors'

export function createAnalyticsService(deps: AnalyticsAppDeps) {
  return {
    async getWorkspace(query: AnalyticsQuery): Promise<AnalyticsWorkspaceSnapshot> {
      if (!deps.can('analytics.view')) throw new AnalyticsPermissionError()
      const dataset = await deps.provider.loadDataset(query)
      return buildAnalyticsSnapshot(dataset, query.filters)
    },
  }
}
