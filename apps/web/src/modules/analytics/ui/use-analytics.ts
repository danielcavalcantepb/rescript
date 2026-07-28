import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import type { AnalyticsFilters } from '../domain/types'
import { getAnalyticsKpis, getAnalyticsOperationalFeed, getAnalyticsRanking, getAnalyticsTimeSeries, getAnalyticsWorkspace, type AnalyticsRpcResult } from './analytics-api'

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

type AnalyticsReadFilters = { from: string; to: string; branchId?: string }

export function useAnalyticsKpis(filters: AnalyticsReadFilters) {
  const organizationId = useOrganization().currentOrganization?.id
  return useQuery({
    queryKey: ['analytics', 'read-model', 'kpis', organizationId, filters],
    enabled: Boolean(organizationId), staleTime: 60_000,
    queryFn: async () => unwrap(await getAnalyticsKpis({ data: { organizationId: organizationId!, ...filters } })),
  })
}

export function useAnalyticsRanking(filters: AnalyticsReadFilters & { dimension: 'product' | 'customer' | 'brand' | 'category' | 'seller' | 'payment_term'; limit?: number }) {
  const organizationId = useOrganization().currentOrganization?.id
  return useQuery({
    queryKey: ['analytics', 'read-model', 'ranking', organizationId, filters],
    enabled: Boolean(organizationId), staleTime: 60_000,
    queryFn: async () => unwrap(await getAnalyticsRanking({ data: { organizationId: organizationId!, ...filters } })),
  })
}

export function useAnalyticsTimeSeries(filters: AnalyticsReadFilters & { grain: 'day' | 'week' | 'month' | 'quarter' | 'year' }) {
  const organizationId = useOrganization().currentOrganization?.id
  return useQuery({
    queryKey: ['analytics', 'read-model', 'series', organizationId, filters],
    enabled: Boolean(organizationId), staleTime: 60_000,
    queryFn: async () => unwrap(await getAnalyticsTimeSeries({ data: { organizationId: organizationId!, ...filters } })),
  })
}

export function useAnalyticsOperationalFeed(filters: { branchId?: string; limit?: number } = {}) {
  const organizationId = useOrganization().currentOrganization?.id
  return useQuery({
    queryKey: ['analytics', 'read-model', 'operational-feed', organizationId, filters],
    enabled: Boolean(organizationId), staleTime: 30_000,
    queryFn: async () => unwrap(await getAnalyticsOperationalFeed({ data: { organizationId: organizationId!, ...filters } })),
  })
}
