import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@rescript/database'
type ProductUpdate = Database['public']['Tables']['product']['Update']
import { createBrowserSupabaseClient } from '#/lib/supabase/client'
import { normalizeSku } from '#/modules/products/domain/validation'
import type {
  CreateProductInput,
  ListProductsQuery,
  ListProductsResult,
  Product,
  ProductRepository,
  UpdateProductInput,
} from '#/modules/products/domain/types'
import {
  asProductRow,
  mapProduct,
  mapProductListItem,
} from '#/modules/products/infrastructure/mappers'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

/** Strip characters that break PostgREST `.or()` / `ilike` filters. */
export function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[,.()"'\\]/g, ' ')
    .replace(/%/g, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function encodeListCursor(value: string, id: string): string {
  return `${encodeURIComponent(value)}::${id}`
}

export function decodeListCursor(
  cursor: string,
): { value: string; id: string } | null {
  const sep = cursor.lastIndexOf('::')
  if (sep <= 0) return null
  try {
    return {
      value: decodeURIComponent(cursor.slice(0, sep)),
      id: cursor.slice(sep + 2),
    }
  } catch {
    return null
  }
}

export class SupabaseProductRepository implements ProductRepository {
  constructor(
    private readonly client: SupabaseClient<Database> = createBrowserSupabaseClient(),
  ) {}

  async list(
    organizationId: string,
    query: ListProductsQuery,
  ): Promise<ListProductsResult> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const status = query.status ?? 'active'
    const sort = query.sort ?? 'name_asc'

    let builder = this.client
      .from('product')
      .select('*')
      .eq('organization_id', organizationId)

    if (status !== 'all') {
      builder = builder.eq('status', status)
    }

    const q = query.q ? sanitizeSearchTerm(query.q) : ''
    if (q) {
      const pattern = `"%${q}%"`
      builder = builder.or(
        `name.ilike.${pattern},sku.ilike.${pattern},category.ilike.${pattern},description.ilike.${pattern}`,
      )
    }

    if (sort === 'updated_desc') {
      builder = builder
        .order('updated_at', { ascending: false })
        .order('id', { ascending: false })
    } else {
      builder = builder
        .order('name', { ascending: true })
        .order('id', { ascending: true })
    }

    if (query.cursor) {
      const decoded = decodeListCursor(query.cursor)
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

    const { data, error } = await builder.limit(limit + 1)
    if (error) throw error

    const rows = (data ?? []).map(asProductRow)
    const page = rows.slice(0, limit)
    const hasMore = rows.length > limit
    const last = page[page.length - 1]
    const nextCursor =
      hasMore && last
        ? sort === 'updated_desc'
          ? encodeListCursor(last.updated_at, last.id)
          : encodeListCursor(last.name, last.id)
        : null

    return {
      items: page.map(mapProductListItem),
      nextCursor,
    }
  }

  async getById(organizationId: string, id: string): Promise<Product | null> {
    const { data, error } = await this.client
      .from('product')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? mapProduct(data) : null
  }

  async create(
    organizationId: string,
    userId: string,
    input: CreateProductInput,
  ): Promise<Product> {
    const row = {
      organization_id: organizationId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      sku: normalizeSku(input.sku),
      category: input.category?.trim() || null,
      unit: input.unit.trim(),
      status: 'active' as const,
      created_by: userId,
      updated_by: userId,
    }

    const { data, error } = await this.client
      .from('product')
      .insert(row)
      .select('*')
      .single()

    if (error) throw error
    return mapProduct(data)
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateProductInput,
  ): Promise<Product> {
    const patch: ProductUpdate = { updated_by: userId }
    if (input.name !== undefined) patch.name = input.name.trim()
    if (input.description !== undefined)
      patch.description = input.description?.trim() || null
    if (input.sku !== undefined) patch.sku = normalizeSku(input.sku)
    if (input.category !== undefined)
      patch.category = input.category?.trim() || null
    if (input.unit !== undefined) patch.unit = input.unit.trim()

    const { data, error } = await this.client
      .from('product')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return mapProduct(data)
  }

  async archive(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<Product> {
    const { data, error } = await this.client
      .from('product')
      .update({
        status: 'inactive',
        archived_at: new Date().toISOString(),
        archived_by: userId,
        updated_by: userId,
      })
      .eq('organization_id', organizationId)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return mapProduct(data)
  }

  async restore(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<Product> {
    const { data, error } = await this.client
      .from('product')
      .update({
        status: 'active',
        archived_at: null,
        archived_by: null,
        updated_by: userId,
      })
      .eq('organization_id', organizationId)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return mapProduct(data)
  }
}

export const supabaseProductRepository = new SupabaseProductRepository()
