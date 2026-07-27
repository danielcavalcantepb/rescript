import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateProductCommand } from '#/modules/catalog/application'
import { catalogCreateProduct } from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

export function useCreateProduct(organizationId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (command: CreateProductCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogCreateProduct({
          data: { organizationId, command },
        }),
      )
    },
    onSuccess: async (product) => {
      if (!organizationId) return
      await queryClient.invalidateQueries({
        queryKey: catalogQueryKeys.products(organizationId),
      })
      queryClient.setQueryData(
        catalogQueryKeys.productDetail(organizationId, product.id),
        undefined,
      )
    },
  })
}
