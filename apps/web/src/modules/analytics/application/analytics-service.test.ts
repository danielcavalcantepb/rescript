import { describe, expect, it } from 'vitest'
import { createAnalyticsService } from './analytics-service'
import type { AnalyticsAppDeps } from './deps'

function deps(canView: boolean): AnalyticsAppDeps {
  return {
    can: (permission) => canView && permission === 'analytics.view',
    provider: {
      async loadDataset() {
        return { generatedAt: '2026-07-27T12:00:00.000Z', records: [], sourceIssues: [] }
      },
    },
  }
}

describe('analytics service', () => {
  it('requires analytics.view on the server-side service', async () => {
    await expect(
      createAnalyticsService(deps(false)).getWorkspace({
        organizationId: 'org_1',
        filters: { period: 'today' },
      }),
    ).rejects.toThrow('analytics_permission_denied')
  })

  it('returns an empty-state-safe workspace when there is no data', async () => {
    const snapshot = await createAnalyticsService(deps(true)).getWorkspace({
      organizationId: 'org_1',
      filters: { period: 'today' },
    })

    expect(snapshot.metrics.length).toBeGreaterThan(0)
    expect(snapshot.metrics.find((metric) => metric.id === 'revenue')?.value).toBe(0)
  })
})
