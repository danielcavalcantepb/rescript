import { useQuery } from '@tanstack/react-query'
import { catalogListCategories } from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

/** @deprecated Prefer useCategories — kept for Phase 4A imports. */
export function useCatalogCategories(
  organizationId: string | undefined,
  enabled = true,
) {
  return useCategories(organizationId, enabled)
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
