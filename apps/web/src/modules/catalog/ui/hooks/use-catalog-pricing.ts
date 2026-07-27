import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AddPriceEntryCommand,
  CreatePriceListCommand,
  PriceListIdCommand,
  ResolveCurrentPriceCommand,
  UpdatePriceListCommand,
} from '#/modules/catalog/application'
import {
  catalogAddPriceEntry,
  catalogArchivePriceList,
  catalogCreatePriceList,
  catalogGetPriceList,
  catalogGetVariantPriceSummary,
  catalogListPriceLists,
  catalogResolvePrice,
  catalogRestorePriceList,
  catalogUpdatePriceList,
} from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

async function invalidatePriceQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string,
  priceListId?: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.priceLists(organizationId),
    }),
    priceListId
      ? queryClient.invalidateQueries({
          queryKey: catalogQueryKeys.priceListDetail(
            organizationId,
            priceListId,
          ),
        })
      : Promise.resolve(),
    queryClient.invalidateQueries({
      queryKey: [...catalogQueryKeys.all(organizationId), 'variant-price-summary'],
    }),
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.products(organizationId),
    }),
  ])
}

export function usePriceLists(
  organizationId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.priceLists(organizationId ?? 'none'),
    enabled: Boolean(organizationId) && enabled,
    staleTime: 30_000,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogListPriceLists({ data: { organizationId } }),
      )
    },
  })
}

export function usePriceList(
  organizationId: string | undefined,
  priceListId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.priceListDetail(
      organizationId ?? 'none',
      priceListId ?? 'none',
    ),
    enabled: Boolean(organizationId && priceListId) && enabled,
    staleTime: 15_000,
    queryFn: async () => {
      if (!organizationId || !priceListId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogGetPriceList({
          data: { organizationId, priceListId },
        }),
      )
    },
  })
}

export function useCreatePriceList(organizationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: CreatePriceListCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogCreatePriceList({
          data: { organizationId, command },
        }),
      )
    },
    onSuccess: async () => {
      if (!organizationId) return
      await invalidatePriceQueries(queryClient, organizationId)
    },
  })
}

export function useUpdatePriceList(organizationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: UpdatePriceListCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogUpdatePriceList({
          data: { organizationId, command },
        }),
      )
    },
    onSuccess: async (list) => {
      if (!organizationId) return
      await invalidatePriceQueries(queryClient, organizationId, list.id)
    },
  })
}

export function useArchivePriceList(organizationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: PriceListIdCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogArchivePriceList({
          data: { organizationId, command },
        }),
      )
    },
    onSuccess: async (list) => {
      if (!organizationId) return
      await invalidatePriceQueries(queryClient, organizationId, list.id)
    },
  })
}

export function useRestorePriceList(organizationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: PriceListIdCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogRestorePriceList({
          data: { organizationId, command },
        }),
      )
    },
    onSuccess: async (list) => {
      if (!organizationId) return
      await invalidatePriceQueries(queryClient, organizationId, list.id)
    },
  })
}

export function useAddPriceEntry(organizationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: AddPriceEntryCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogAddPriceEntry({
          data: { organizationId, command },
        }),
      )
    },
    onSuccess: async (entry) => {
      if (!organizationId) return
      await invalidatePriceQueries(
        queryClient,
        organizationId,
        entry.priceListId,
      )
    },
  })
}

export function useResolvedPrice(
  organizationId: string | undefined,
  command: ResolveCurrentPriceCommand | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.resolvedPrice(
      organizationId ?? 'none',
      command?.variantId ?? 'none',
      command?.at ?? 'none',
      command?.priceListId,
    ),
    enabled: Boolean(organizationId && command?.variantId && command.at) && enabled,
    staleTime: 15_000,
    queryFn: async () => {
      if (!organizationId || !command) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogResolvePrice({
          data: { organizationId, command },
        }),
      )
    },
  })
}

export function usePricesByVariant(
  organizationId: string | undefined,
  variantId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.variantPriceSummary(
      organizationId ?? 'none',
      variantId ?? 'none',
    ),
    enabled: Boolean(organizationId && variantId) && enabled,
    staleTime: 15_000,
    queryFn: async () => {
      if (!organizationId || !variantId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogGetVariantPriceSummary({
          data: { organizationId, variantId },
        }),
      )
    },
  })
}
