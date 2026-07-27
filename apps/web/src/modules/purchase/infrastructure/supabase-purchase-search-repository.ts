import '#/modules/purchase/infrastructure/assert-server-only'
import type { PurchaseSearchRepository } from '#/modules/purchase/application/ports'
import type {
  ListPurchasesQuery,
  ListPurchasesResult,
  PurchaseListItem,
  SearchPurchasesQuery,
} from '#/modules/purchase/domain/types'
import type { PurchaseReposOptions } from '#/modules/purchase/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/purchase/infrastructure/errors'
import {
  decodeListCursor,
  encodeListCursor,
  sanitizeSearchTerm,
} from '#/modules/purchase/infrastructure/list-helpers'
import { mapPurchaseListItem } from '#/modules/purchase/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/purchase/infrastructure/tenant-context'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export class SupabasePurchaseSearchRepository implements PurchaseSearchRepository {
  constructor(private readonly options: PurchaseReposOptions) {}

  async list(
    organizationId: string,
    query: ListPurchasesQuery,
  ): Promise<ListPurchasesResult> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const status = query.status ?? 'all'
    const sort = query.sort ?? 'created_desc'

    let builder = this.options.client
      .from('purchase_search')
      .select('*')
      .eq('organization_id', this.options.organizationId)

    if (status !== 'all') {
      builder = builder.eq('status', status)
    }

    const q = query.q ? sanitizeSearchTerm(query.q) : ''
    if (q) {
      const digits = q.replace(/\D/g, '')
      const pattern = `"%${q.toLowerCase()}%"`
      if (digits.length >= 3) {
        builder = builder.or(
          `search_text.ilike.${pattern},supplier_document.ilike."%${digits}%"`,
        )
      } else {
        builder = builder.ilike('search_text', `%${q.toLowerCase()}%`)
      }
    }

    if (query.from) {
      builder = builder.gte('created_at', query.from)
    }
    if (query.to) {
      builder = builder.lte('created_at', query.to)
    }

    if (sort === 'number_asc') {
      builder = builder
        .order('number', { ascending: true })
        .order('purchase_order_id', { ascending: true })
    } else {
      builder = builder
        .order('created_at', { ascending: false })
        .order('purchase_order_id', { ascending: false })
    }

    if (query.cursor) {
      const decoded = decodeListCursor(query.cursor)
      if (decoded) {
        if (sort === 'number_asc') {
          builder = builder.or(
            `number.gt.${decoded.value},and(number.eq.${decoded.value},purchase_order_id.gt.${decoded.id})`,
          )
        } else {
          builder = builder.or(
            `created_at.lt.${decoded.value},and(created_at.eq.${decoded.value},purchase_order_id.lt.${decoded.id})`,
          )
        }
      }
    }

    const { data, error } = await builder.limit(limit + 1)
    throwIfSupabaseError(error)
    const rows = data ?? []
    const page = rows.slice(0, limit)
    const hasMore = rows.length > limit
    const last = page[page.length - 1]
    const nextCursor =
      hasMore && last
        ? sort === 'number_asc'
          ? encodeListCursor(last.number, last.purchase_order_id)
          : encodeListCursor(last.created_at, last.purchase_order_id)
        : null

    return {
      items: page.map(mapPurchaseListItem),
      nextCursor,
    }
  }

  async search(
    organizationId: string,
    query: SearchPurchasesQuery,
  ): Promise<PurchaseListItem[]> {
    const result = await this.list(organizationId, {
      q: query.q,
      status: query.status ?? 'all',
      limit: query.limit ?? 20,
      sort: 'created_desc',
    })
    return result.items
  }
}
