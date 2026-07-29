import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateAttributeCommand,
  UpdateAttributeCommand,
} from '#/modules/catalog/application'
import {
  catalogCreateAttribute,
  catalogDeleteAttribute,
  catalogListAttributes,
  catalogUpdateAttribute,
} from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

export function useCatalogAttributes(
  organizationId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.attributes(organizationId ?? 'none'),
    enabled: Boolean(organizationId) && enabled,
    staleTime: 60_000,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogListAttributes({ data: { organizationId } }),
      )
    },
  })
}

export function useCatalogAttributeActions(
  organizationId: string | undefined,
) {
  const queryClient = useQueryClient()
  const create = useMutation({
    mutationFn: async (command: CreateAttributeCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogCreateAttribute({ data: { organizationId, command } }),
      )
    },
    onSuccess: async () => {
      if (!organizationId) return
      await queryClient.invalidateQueries({
        queryKey: catalogQueryKeys.attributes(organizationId),
      })
    },
  })
  const update = useMutation({
    mutationFn: async (command: UpdateAttributeCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogUpdateAttribute({ data: { organizationId, command } }),
      )
    },
    onSuccess: async () => {
      if (!organizationId) return
      await queryClient.invalidateQueries({
        queryKey: catalogQueryKeys.attributes(organizationId),
      })
    },
  })
  const remove = useMutation({
    mutationFn: async (attributeId: string) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogDeleteAttribute({
          data: { organizationId, command: { attributeId } },
        }),
      )
    },
    onSuccess: async () => {
      if (!organizationId) return
      await queryClient.invalidateQueries({
        queryKey: catalogQueryKeys.attributes(organizationId),
      })
    },
  })
  return { create, update, remove }
}
