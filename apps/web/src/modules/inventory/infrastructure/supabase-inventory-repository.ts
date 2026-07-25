import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@rescript/database'
import { createBrowserSupabaseClient } from '#/lib/supabase/client'
import type {
  CreateMovementInput,
  InventoryMovement,
  InventoryRepository,
  ListMovementsQuery,
  ListMovementsResult,
  ListStockQuery,
  ListStockResult,
  ProductStock,
} from '#/modules/inventory/domain/types'
import {
  decodeListCursor,
  encodeListCursor,
  sanitizeSearchTerm,
} from '#/modules/inventory/infrastructure/list-helpers'
import {
  mapInventoryMovement,
  mapProductStock,
  type ProductWithBalanceRow,
} from '#/modules/inventory/infrastructure/mappers'

export {
  decodeListCursor,
  encodeListCursor,
  sanitizeSearchTerm,
} from '#/modules/inventory/infrastructure/list-helpers'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

const STOCK_SELECT_EMBED =
  'id, organization_id, name, sku, unit, status, updated_at, inventory_balance(quantity, updated_at, organization_id)'

const STOCK_SELECT_PLAIN =
  'id, organization_id, name, sku, unit, status, updated_at'

function isRelationshipEmbedError(error: unknown): boolean {
  if (typeof error !== 'object' || !error) return false
  const message = String(
    (error as { message?: string; details?: string; hint?: string }).message ??
      '',
  )
  const details = String((error as { details?: string }).details ?? '')
  const hint = String((error as { hint?: string }).hint ?? '')
  const text = `${message} ${details} ${hint}`.toLowerCase()
  return (
    text.includes('relationship') ||
    text.includes('could not find') ||
    text.includes('embedding') ||
    text.includes('foreign key')
  )
}

export class SupabaseInventoryRepository implements InventoryRepository {
  constructor(
    private readonly client: SupabaseClient<Database> = createBrowserSupabaseClient(),
  ) {}

  async listStock(
    organizationId: string,
    query: ListStockQuery,
  ): Promise<ListStockResult> {
    try {
      return await this.listStockWithEmbed(organizationId, query)
    } catch (error) {
      if (isRelationshipEmbedError(error)) {
        return this.listStockWithParallelQueries(organizationId, query)
      }
      throw error
    }
  }

  private async listStockWithEmbed(
    organizationId: string,
    query: ListStockQuery,
  ): Promise<ListStockResult> {
    const { limit, status, sort, stockFilter } = this.stockQueryParts(query)

    let builder = this.client
      .from('product')
      .select(STOCK_SELECT_EMBED)
      .eq('organization_id', organizationId)

    if (status !== 'all') {
      builder = builder.eq('status', status)
    }

    const q = query.q ? sanitizeSearchTerm(query.q) : ''
    if (q) {
      const pattern = `"%${q}%"`
      builder = builder.or(
        `name.ilike.${pattern},sku.ilike.${pattern},category.ilike.${pattern}`,
      )
    }

    builder = this.applyStockSortAndCursor(builder, sort, query.cursor)

    const { data, error } = await builder.limit(limit + 1)
    if (error) throw error

    const rows = (data ?? []) as unknown as ProductWithBalanceRow[]
    let items = rows.map((row) => mapProductStock(row))
    if (stockFilter !== 'all') {
      items = items.filter((item) => item.stockStatus === stockFilter)
    }

    return this.paginateStock(items, limit, sort)
  }

  private async listStockWithParallelQueries(
    organizationId: string,
    query: ListStockQuery,
  ): Promise<ListStockResult> {
    const { limit, status, sort, stockFilter } = this.stockQueryParts(query)

    let builder = this.client
      .from('product')
      .select(STOCK_SELECT_PLAIN)
      .eq('organization_id', organizationId)

    if (status !== 'all') {
      builder = builder.eq('status', status)
    }

    const q = query.q ? sanitizeSearchTerm(query.q) : ''
    if (q) {
      const pattern = `"%${q}%"`
      builder = builder.or(
        `name.ilike.${pattern},sku.ilike.${pattern},category.ilike.${pattern}`,
      )
    }

    builder = this.applyStockSortAndCursor(builder, sort, query.cursor)

    const { data: products, error: productError } = await builder.limit(
      limit + 1,
    )
    if (productError) throw productError

    const productRows = (products ?? []) as unknown as ProductWithBalanceRow[]
    const ids = productRows.map((p) => p.id)

    const balanceByProduct = new Map<
      string,
      { quantity: unknown; updated_at?: string | null }
    >()

    if (ids.length > 0) {
      const { data: balances, error: balanceError } = await this.client
        .from('inventory_balance')
        .select('product_id, quantity, updated_at')
        .eq('organization_id', organizationId)
        .in('product_id', ids)

      if (balanceError) throw balanceError
      for (const row of balances ?? []) {
        balanceByProduct.set(row.product_id, {
          quantity: row.quantity,
          updated_at: row.updated_at,
        })
      }
    }

    let items = productRows.map((row) =>
      mapProductStock(row, balanceByProduct.get(row.id) ?? null),
    )
    if (stockFilter !== 'all') {
      items = items.filter((item) => item.stockStatus === stockFilter)
    }

    return this.paginateStock(items, limit, sort)
  }

  private stockQueryParts(query: ListStockQuery) {
    return {
      limit: Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT),
      status: query.status ?? 'active',
      sort: query.sort ?? 'name_asc',
      stockFilter: query.stockStatus ?? 'all',
    }
  }

  private applyStockSortAndCursor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    builder: any,
    sort: 'name_asc' | 'updated_desc',
    cursor?: string | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    if (sort === 'updated_desc') {
      builder = builder
        .order('updated_at', { ascending: false })
        .order('id', { ascending: false })
    } else {
      builder = builder
        .order('name', { ascending: true })
        .order('id', { ascending: true })
    }

    if (cursor) {
      const decoded = decodeListCursor(cursor)
      if (decoded) {
        if (sort === 'updated_desc') {
          builder = builder.or(
            `updated_at.lt.${decoded.value},and(updated_at.eq.${decoded.value},id.lt.${decoded.id})`,
          )
        } else {
          builder = builder.or(
            `name.gt.${decoded.value},and(name.eq.${decoded.value},id.gt.${decoded.id})`,
          )
        }
      }
    }
    return builder
  }

  private paginateStock(
    items: ProductStock[],
    limit: number,
    sort: 'name_asc' | 'updated_desc',
  ): ListStockResult {
    const page = items.slice(0, limit)
    const hasMore = items.length > limit
    const last = page[page.length - 1]
    const nextCursor =
      hasMore && last
        ? sort === 'updated_desc'
          ? encodeListCursor(last.updatedAt, last.productId)
          : encodeListCursor(last.name, last.productId)
        : null
    return { items: page, nextCursor }
  }

  async getProductStock(
    organizationId: string,
    productId: string,
  ): Promise<ProductStock | null> {
    try {
      const { data, error } = await this.client
        .from('product')
        .select(STOCK_SELECT_EMBED)
        .eq('organization_id', organizationId)
        .eq('id', productId)
        .maybeSingle()

      if (error) throw error
      if (!data) return null
      return mapProductStock(data as unknown as ProductWithBalanceRow)
    } catch (error) {
      if (!isRelationshipEmbedError(error)) throw error

      const { data: product, error: productError } = await this.client
        .from('product')
        .select(STOCK_SELECT_PLAIN)
        .eq('organization_id', organizationId)
        .eq('id', productId)
        .maybeSingle()

      if (productError) throw productError
      if (!product) return null

      const { data: balance, error: balanceError } = await this.client
        .from('inventory_balance')
        .select('quantity, updated_at')
        .eq('organization_id', organizationId)
        .eq('product_id', productId)
        .maybeSingle()

      if (balanceError) throw balanceError

      return mapProductStock(
        product as unknown as ProductWithBalanceRow,
        balance,
      )
    }
  }

  async listMovements(
    organizationId: string,
    query: ListMovementsQuery,
  ): Promise<ListMovementsResult> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT)

    let builder = this.client
      .from('inventory_movement')
      .select('*')
      .eq('organization_id', organizationId)
      .order('occurred_at', { ascending: false })
      .order('id', { ascending: false })

    if (query.productId) {
      builder = builder.eq('product_id', query.productId)
    }

    if (query.type && query.type !== 'all') {
      builder = builder.eq('type', query.type)
    }

    if (query.from) {
      builder = builder.gte('occurred_at', query.from)
    }
    if (query.to) {
      builder = builder.lte('occurred_at', query.to)
    }

    const q = query.q ? sanitizeSearchTerm(query.q) : ''
    if (q) {
      const pattern = `"%${q}%"`
      builder = builder.or(`reason.ilike.${pattern},notes.ilike.${pattern}`)
    }

    if (query.cursor) {
      const decoded = decodeListCursor(query.cursor)
      if (decoded) {
        builder = builder.or(
          `occurred_at.lt.${decoded.value},and(occurred_at.eq.${decoded.value},id.lt.${decoded.id})`,
        )
      }
    }

    const { data, error } = await builder.limit(limit + 1)
    if (error) throw error

    const rows = data ?? []
    const page = rows.slice(0, limit)
    const hasMore = rows.length > limit
    const last = page[page.length - 1]
    const nextCursor =
      hasMore && last
        ? encodeListCursor(last.occurred_at, last.id)
        : null

    return {
      items: page.map(mapInventoryMovement),
      nextCursor,
    }
  }

  async registerMovement(
    organizationId: string,
    input: CreateMovementInput,
  ): Promise<InventoryMovement> {
    const { data, error } = await this.client.rpc('register_inventory_movement', {
      p_organization_id: organizationId,
      p_product_id: input.productId,
      p_type: input.type,
      p_quantity: Number(input.quantity),
      p_reason: input.reason.trim(),
      p_notes: input.notes?.trim() || undefined,
      p_occurred_at: input.occurredAt || undefined,
    })

    if (error) throw error
    if (!data) throw new Error('register_inventory_movement_empty')
    return mapInventoryMovement(data)
  }
}

export const supabaseInventoryRepository = new SupabaseInventoryRepository()
