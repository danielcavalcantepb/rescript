import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import type { AnalyticsFilters } from '../domain/types'
import { getAnalyticsWorkspace, type AnalyticsRpcResult } from './analytics-api'

function unwrap<T>(result: AnalyticsRpcResult<T>): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

export function useAnalytics(filters: AnalyticsFilters) {
  const organizationId = useOrganization().currentOrganization?.id

  return useQuery({
    queryKey: queryKeys.analytics.workspace(organizationId ?? 'none', filters),
    enabled: Boolean(organizationId),
    staleTime: 120_000,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrap(await getAnalyticsWorkspace({ data: { organizationId, filters } }))
    },
  })
}
