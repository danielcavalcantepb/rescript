import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import { getCommandCenter, type CommandCenterRpcResult } from './command-center-api'

function unwrap<T>(result: CommandCenterRpcResult<T>): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

export function useCommandCenter() {
  const organizationId = useOrganization().currentOrganization?.id

  return useQuery({
    queryKey: queryKeys.commandCenter.overview(organizationId ?? 'none'),
    enabled: Boolean(organizationId),
    staleTime: 60_000,
    retry: 1,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrap(await getCommandCenter({ data: { organizationId } }))
    },
  })
}
