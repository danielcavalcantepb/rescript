import { useQuery } from '@tanstack/react-query'
import { getCashFlowSnapshot } from './cash-api'

export function useCashFlow(organizationId?: string) {
  return useQuery({
    queryKey: ['finance', 'cash-flow', organizationId],
    enabled: Boolean(organizationId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_organization')
      return getCashFlowSnapshot({ data: { organizationId } })
    },
  })
}
