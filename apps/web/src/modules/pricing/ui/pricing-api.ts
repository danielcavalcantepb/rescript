import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import type {
  CreatePriceItemCommand,
  CreatePriceListCommand,
  PriceItemFilters,
  PriceListFilters,
  ResolvePriceQuery,
} from '#/modules/pricing/application/contracts'
import type {
  Page,
  PriceListItem,
  PriceListSummary,
  PricingVariant,
  ResolvedPrice,
} from '#/modules/pricing/domain/types'

type RpcResult<T> = { data: T | null; error: { message: string } | null }

async function pricingClient() {
  const { createServerSupabaseClient } = await import(
    '#/lib/supabase/server.server'
  )
  const client = createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await client.auth.getUser()
  if (error || !user) throw new Error('not_authenticated')
  setResponseHeader('Cache-Control', 'no-store')
  setResponseHeader('Vary', 'Cookie, Authorization')
  return client
}

async function rpc<T>(
  name: string,
  args: Record<string, unknown>,
): Promise<T> {
  const client = await pricingClient()
  const result = (await client.rpc(
    name as never,
    args as never,
  )) as unknown as RpcResult<T>
  if (result.error) throw new Error(result.error.message)
  if (result.data == null) throw new Error('pricing_empty_response')
  return result.data
}

async function rpcVoid(
  name: string,
  args: Record<string, unknown>,
): Promise<void> {
  const client = await pricingClient()
  const result = (await client.rpc(
    name as never,
    args as never,
  )) as unknown as RpcResult<null>
  if (result.error) throw new Error(result.error.message)
}

export const listPriceLists = createServerFn({ method: 'POST' })
  .validator((value: PriceListFilters) => value)
  .handler(({ data }) =>
    rpc<Page<PriceListSummary>>('list_price_lists', {
      p_organization_id: data.organizationId,
      p_search: data.search?.trim() || null,
      p_status: data.status || null,
      p_page: data.page ?? 1,
      p_page_size: data.pageSize ?? 25,
    }),
  )

export const listPriceItems = createServerFn({ method: 'POST' })
  .validator((value: PriceItemFilters) => value)
  .handler(({ data }) =>
    rpc<Page<PriceListItem>>('list_price_list_items', {
      p_organization_id: data.organizationId,
      p_search: data.search?.trim() || null,
      p_status: data.status || null,
      p_price_list_id: data.priceListId || null,
      p_product_id: data.productId || null,
      p_variant_id: data.variantId || null,
      p_page: data.page ?? 1,
      p_page_size: data.pageSize ?? 25,
    }),
  )

export const searchPricingVariants = createServerFn({ method: 'POST' })
  .validator((value: { organizationId: string; search: string }) => value)
  .handler(({ data }) =>
    rpc<PricingVariant[]>('search_pricing_variants', {
      p_organization_id: data.organizationId,
      p_search: data.search.trim(),
      p_limit: 20,
    }),
  )

export const createPricingList = createServerFn({ method: 'POST' })
  .validator((value: CreatePriceListCommand) => value)
  .handler(({ data }) =>
    rpc<string>('create_price_list', {
      p_organization_id: data.organizationId,
      p_name: data.name,
      p_code: data.code,
      p_currency: data.currency,
      p_valid_from: data.validFrom,
      p_valid_to: data.validTo || null,
    }),
  )

export const archivePricingList = createServerFn({ method: 'POST' })
  .validator((value: { organizationId: string; priceListId: string }) => value)
  .handler(({ data }) =>
    rpcVoid('archive_price_list', {
      p_organization_id: data.organizationId,
      p_price_list_id: data.priceListId,
    }),
  )

export const createPricingItem = createServerFn({ method: 'POST' })
  .validator((value: CreatePriceItemCommand) => value)
  .handler(({ data }) =>
    rpc<string>('create_price_list_item', {
      p_organization_id: data.organizationId,
      p_price_list_id: data.priceListId,
      p_variant_id: data.variantId,
      p_amount: data.amount,
      p_minimum_amount: data.minimumAmount,
      p_valid_from: data.validFrom,
      p_valid_to: data.validTo || null,
    }),
  )

export const resolvePricingPrice = createServerFn({ method: 'POST' })
  .validator((value: ResolvePriceQuery) => value)
  .handler(async ({ data }) => {
    const client = await pricingClient()
    const result = (await client.rpc('resolve_price' as never, {
      p_organization_id: data.organizationId,
      p_price_list_id: data.priceListId,
      p_variant_id: data.variantId,
      p_at: data.at,
    } as never)) as unknown as RpcResult<ResolvedPrice | null>
    if (result.error) throw new Error(result.error.message)
    return result.data
  })
