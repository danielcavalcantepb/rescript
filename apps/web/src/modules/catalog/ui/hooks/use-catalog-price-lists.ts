import { useQuery } from '@tanstack/react-query'
import { catalogListPriceLists } from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

export function useCatalogPriceLists(
  organizationId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.priceLists(organizationId ?? 'none'),
    enabled: Boolean(organizationId) && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogListPriceLists({ data: { organizationId } }),
      )
    },
  })
}
