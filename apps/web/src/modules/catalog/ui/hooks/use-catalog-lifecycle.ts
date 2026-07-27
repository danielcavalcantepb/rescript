import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { LifecycleProductCommand } from '#/modules/catalog/application'
import {
  catalogArchiveProduct,
  catalogDeactivateProduct,
  catalogGetLifecycle,
  catalogPublishProduct,
  catalogRestoreProduct,
} from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

async function invalidateProductQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string,
  productId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.products(organizationId),
    }),
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.productDetail(organizationId, productId),
    }),
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.productLifecycle(organizationId, productId),
    }),
  ])
}

export function useLifecycle(
  organizationId: string | undefined,
  productId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.productLifecycle(
      organizationId ?? 'none',
      productId ?? 'none',
    ),
    enabled: Boolean(organizationId && productId) && enabled,
    staleTime: 15_000,
    queryFn: async () => {
      if (!organizationId || !productId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogGetLifecycle({
          data: { organizationId, productId },
        }),
      )
    },
  })
}

function useLifecycleMutation(
  organizationId: string | undefined,
  run: (
    organizationId: string,
    command: LifecycleProductCommand,
  ) => Promise<{ id: string }>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: LifecycleProductCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return run(organizationId, command)
    },
    onSuccess: async (product) => {
      if (!organizationId) return
      await invalidateProductQueries(queryClient, organizationId, product.id)
    },
  })
}

export function usePublishProduct(organizationId: string | undefined) {
  return useLifecycleMutation(organizationId, async (orgId, command) =>
    unwrapCatalogRpc(
      await catalogPublishProduct({
        data: { organizationId: orgId, command },
      }),
    ),
  )
}

export function useArchiveProduct(organizationId: string | undefined) {
  return useLifecycleMutation(organizationId, async (orgId, command) =>
    unwrapCatalogRpc(
      await catalogArchiveProduct({
        data: { organizationId: orgId, command },
      }),
    ),
  )
}

export function useRestoreProduct(organizationId: string | undefined) {
  return useLifecycleMutation(organizationId, async (orgId, command) =>
    unwrapCatalogRpc(
      await catalogRestoreProduct({
        data: { organizationId: orgId, command },
      }),
    ),
  )
}

export function useDeactivateProduct(organizationId: string | undefined) {
  return useLifecycleMutation(organizationId, async (orgId, command) =>
    unwrapCatalogRpc(
      await catalogDeactivateProduct({
        data: { organizationId: orgId, command },
      }),
    ),
  )
}
