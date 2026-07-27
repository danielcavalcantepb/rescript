import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UpdateProductCommand } from '#/modules/catalog/application'
import { catalogUpdateProduct } from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

export function useUpdateProduct(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (command: UpdateProductCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogUpdateProduct({
          data: { organizationId, command },
        }),
      )
    },
    onSuccess: async (product) => {
      if (!organizationId) return
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: catalogQueryKeys.products(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: catalogQueryKeys.productDetail(
            organizationId,
            product.id,
          ),
        }),
      ])
    },
  })
}
