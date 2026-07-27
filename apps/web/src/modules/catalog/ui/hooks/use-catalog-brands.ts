import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  catalogCreateBrand,
  catalogListBrands,
  catalogUpdateBrand,
} from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

/** @deprecated Prefer useBrands — kept for Phase 4A imports. */
export function useCatalogBrands(
  organizationId: string | undefined,
  enabled = true,
) {
  return useBrands(organizationId, enabled)
}

export function useBrandActions(organizationId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = async () => {
    if (!organizationId) return
    await queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.brands(organizationId),
    })
  }
  const create = useMutation({
    mutationFn: async (name: string) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogCreateBrand({
          data: { organizationId, command: { name } },
        }),
      )
    },
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: async (input: { brandId: string; name: string }) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogUpdateBrand({
          data: { organizationId, command: input },
        }),
      )
    },
    onSuccess: invalidate,
  })
  return { create, update }
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
