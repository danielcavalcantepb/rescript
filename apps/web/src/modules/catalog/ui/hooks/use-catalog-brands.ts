import { useQuery } from '@tanstack/react-query'
import { catalogListBrands } from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

/** @deprecated Prefer useBrands — kept for Phase 4A imports. */
export function useCatalogBrands(
  organizationId: string | undefined,
  enabled = true,
) {
  return useBrands(organizationId, enabled)
}

export function useBrands(
  organizationId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.brands(organizationId ?? 'none'),
    enabled: Boolean(organizationId) && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogListBrands({ data: { organizationId } }),
      )
    },
  })
}
