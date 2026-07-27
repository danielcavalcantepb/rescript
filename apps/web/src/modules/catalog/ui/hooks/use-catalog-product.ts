import { useQuery } from '@tanstack/react-query'
import { catalogGetProduct } from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

export function useProduct(
  organizationId: string | undefined,
  productId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.productDetail(
      organizationId ?? 'none',
      productId ?? 'none',
    ),
    enabled: Boolean(organizationId && productId) && enabled,
    staleTime: 30_000,
    retry: (count, error) => {
      const code =
        error &&
        typeof error === 'object' &&
        'rpc' in error &&
        typeof (error as { rpc?: { code?: string } }).rpc?.code === 'string'
          ? (error as { rpc: { code: string } }).rpc.code
          : null
      if (code === 'not_found' || code === 'forbidden') return false
      return count < 2
    },
    queryFn: async () => {
      if (!organizationId || !productId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogGetProduct({
          data: { organizationId, productId },
        }),
      )
    },
  })
}
