import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreatePriceItemCommand,
  CreatePriceListCommand,
  PriceItemFilters,
  PriceListFilters,
  ResolvePriceQuery,
} from '#/modules/pricing/application/contracts'
import {
  archivePricingList,
  createPricingItem,
  createPricingList,
  listPriceItems,
  listPriceLists,
  resolvePricingPrice,
  searchPricingVariants,
} from '#/modules/pricing/ui/pricing-api'

export const pricingKeys = {
  root: ['pricing'] as const,
  lists: (filters: PriceListFilters) => [...pricingKeys.root, 'lists', filters] as const,
  items: (filters: PriceItemFilters) => [...pricingKeys.root, 'items', filters] as const,
  variants: (organizationId: string, search: string) =>
    [...pricingKeys.root, 'variants', organizationId, search] as const,
}

export function usePriceLists(filters: PriceListFilters, enabled = true) {
  return useQuery({
    queryKey: pricingKeys.lists(filters),
    queryFn: () => listPriceLists({ data: filters }),
    enabled,
    staleTime: 30_000,
  })
}

export function usePriceItems(filters: PriceItemFilters, enabled = true) {
  return useQuery({
    queryKey: pricingKeys.items(filters),
    queryFn: () => listPriceItems({ data: filters }),
    enabled,
    staleTime: 15_000,
  })
}

export function usePricingVariants(organizationId: string, search: string) {
  return useQuery({
    queryKey: pricingKeys.variants(organizationId, search),
    queryFn: () => searchPricingVariants({ data: { organizationId, search } }),
    enabled: Boolean(organizationId) && search.trim().length >= 2,
    staleTime: 30_000,
  })
}

export function useCreatePriceList() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (command: CreatePriceListCommand) =>
      createPricingList({ data: command }),
    onSuccess: () => client.invalidateQueries({ queryKey: pricingKeys.root }),
  })
}

export function useArchivePriceList() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (command: { organizationId: string; priceListId: string }) =>
      archivePricingList({ data: command }),
    onSuccess: () => client.invalidateQueries({ queryKey: pricingKeys.root }),
  })
}

export function useCreatePriceItem() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (command: CreatePriceItemCommand) =>
      createPricingItem({ data: command }),
    onSuccess: () => client.invalidateQueries({ queryKey: pricingKeys.root }),
  })
}

export function useResolvePrice() {
  return useMutation({
    mutationFn: (query: ResolvePriceQuery) =>
      resolvePricingPrice({ data: query }),
  })
}
