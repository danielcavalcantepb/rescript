import { useQuery } from '@tanstack/react-query'
import { catalogListUnitsOfMeasure } from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

export function useUnits(
  organizationId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.units(organizationId ?? 'none'),
    enabled: Boolean(organizationId) && enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogListUnitsOfMeasure({ data: { organizationId } }),
      )
    },
  })
}
