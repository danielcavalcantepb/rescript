import { useQuery } from '@tanstack/react-query'
import type { ListCatalogProductsQuery } from '#/modules/catalog/application'
import { catalogListProducts } from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

export function useCatalogProducts(
  organizationId: string | undefined,
  query: ListCatalogProductsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.productList(organizationId ?? 'none', query),
    enabled: Boolean(organizationId) && enabled,
    staleTime: 30_000,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogListProducts({
          data: { organizationId, query },
        }),
      )
    },
  })
}
