import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  catalogCreateCategory,
  catalogListCategories,
  catalogMoveCategory,
  catalogUpdateCategory,
} from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

/** @deprecated Prefer useCategories — kept for Phase 4A imports. */
export function useCatalogCategories(
  organizationId: string | undefined,
  enabled = true,
) {
  return useCategories(organizationId, enabled)
}

export function useCategoryActions(organizationId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = async () => {
    if (!organizationId) return
    await queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.categories(organizationId),
    })
  }
  const create = useMutation({
    mutationFn: async (input: { name: string; parentId?: string | null }) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogCreateCategory({
          data: { organizationId, command: input },
        }),
      )
    },
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: async (input: { categoryId: string; name: string }) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogUpdateCategory({
          data: { organizationId, command: input },
        }),
      )
    },
    onSuccess: invalidate,
  })
  const move = useMutation({
    mutationFn: async (input: {
      categoryId: string
      newParentId: string | null
    }) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogMoveCategory({
          data: { organizationId, command: input },
        }),
      )
    },
    onSuccess: invalidate,
  })
  return { create, update, move }
}

export function useCategories(
  organizationId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.categories(organizationId ?? 'none'),
    enabled: Boolean(organizationId) && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogListCategories({ data: { organizationId } }),
      )
    },
  })
}
