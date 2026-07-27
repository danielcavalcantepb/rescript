import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ApplyVariantCombinationsCommand,
  ListProductVariantsQuery,
  PreviewVariantCombinationsCommand,
  UpdateVariantCommand,
  VariantIdCommand,
  VariantAxisDraft,
} from '#/modules/catalog/application'
import {
  catalogApplyVariantCombinations,
  catalogArchiveVariant,
  catalogListProductVariants,
  catalogPreviewVariantCombinations,
  catalogRestoreVariant,
  catalogSearchVariants,
  catalogUpdateVariant,
} from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogQueryKeys } from '#/platform/cache/catalog-query-keys'

async function invalidateVariantQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string,
  productId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.productVariants(organizationId, productId),
    }),
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.variantAxes(organizationId, productId),
    }),
    queryClient.invalidateQueries({
      queryKey: catalogQueryKeys.productDetail(organizationId, productId),
    }),
    queryClient.invalidateQueries({
      queryKey: [...catalogQueryKeys.products(organizationId), 'combination-preview'],
    }),
  ])
}

export function useProductVariants(
  organizationId: string | undefined,
  query: ListProductVariantsQuery | undefined,
  enabled = true,
) {
  const status = query?.status ?? 'all'
  const page = query?.page ?? 1
  const pageSize = query?.pageSize ?? 50
  return useQuery({
    queryKey: catalogQueryKeys.productVariants(
      organizationId ?? 'none',
      query?.productId ?? 'none',
      { status, page, pageSize },
    ),
    enabled: Boolean(organizationId && query?.productId) && enabled,
    staleTime: 15_000,
    queryFn: async () => {
      if (!organizationId || !query) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogListProductVariants({
          data: { organizationId, query },
        }),
      )
    },
  })
}

export function useCatalogVariantSearch(
  organizationId: string | undefined,
  text: string,
  enabled = true,
) {
  return useQuery({
    queryKey: catalogQueryKeys.variantSearch(organizationId ?? 'none', text),
    enabled: Boolean(organizationId && text.trim().length >= 2) && enabled,
    staleTime: 15_000,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogSearchVariants({
          data: { organizationId, query: { text, limit: 20 } },
        }),
      )
    },
  })
}

export function usePreviewVariantCombinations(
  organizationId: string | undefined,
  productId: string | undefined,
  axes: VariantAxisDraft[] | undefined,
  enabled = true,
) {
  const axesKey = JSON.stringify(axes ?? null)
  return useQuery({
    queryKey: catalogQueryKeys.combinationPreview(
      organizationId ?? 'none',
      productId ?? 'none',
      axesKey,
    ),
    enabled: Boolean(organizationId && productId && axes?.length) && enabled,
    staleTime: 5_000,
    queryFn: async () => {
      if (!organizationId || !productId || !axes) throw new Error('missing_org')
      const command: PreviewVariantCombinationsCommand = {
        productId,
        axes,
      }
      return unwrapCatalogRpc(
        await catalogPreviewVariantCombinations({
          data: { organizationId, command },
        }),
      )
    },
  })
}

export function useApplyVariantCombinations(organizationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: ApplyVariantCombinationsCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogApplyVariantCombinations({
          data: { organizationId, command },
        }),
      )
    },
    onSuccess: async (result) => {
      if (!organizationId) return
      await invalidateVariantQueries(
        queryClient,
        organizationId,
        result.product.id,
      )
    },
  })
}

export function useUpdateVariant(organizationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: UpdateVariantCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogUpdateVariant({
          data: { organizationId, command },
        }),
      )
    },
    onSuccess: async (variant) => {
      if (!organizationId) return
      await invalidateVariantQueries(
        queryClient,
        organizationId,
        variant.productId,
      )
    },
  })
}

export function useArchiveVariant(organizationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: VariantIdCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogArchiveVariant({
          data: { organizationId, command },
        }),
      )
    },
    onSuccess: async (variant) => {
      if (!organizationId) return
      await invalidateVariantQueries(
        queryClient,
        organizationId,
        variant.productId,
      )
    },
  })
}

export function useRestoreVariant(organizationId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (command: VariantIdCommand) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCatalogRpc(
        await catalogRestoreVariant({
          data: { organizationId, command },
        }),
      )
    },
    onSuccess: async (variant) => {
      if (!organizationId) return
      await invalidateVariantQueries(
        queryClient,
        organizationId,
        variant.productId,
      )
    },
  })
}
