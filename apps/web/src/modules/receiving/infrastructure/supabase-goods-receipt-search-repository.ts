import '#/modules/receiving/infrastructure/assert-server-only'
import type { GoodsReceiptSearchRepository } from '#/modules/receiving/application/ports'
import type {
  ListReceiptsQuery,
  ListReceiptsResult,
  ReceiptListItem,
  SearchReceiptsQuery,
} from '#/modules/receiving/domain/types'
import type { ReceivingReposOptions } from '#/modules/receiving/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/receiving/infrastructure/errors'
import {
  decodeListCursor,
  encodeListCursor,
  sanitizeSearchTerm,
} from '#/modules/receiving/infrastructure/list-helpers'
import { mapReceiptListItem } from '#/modules/receiving/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/receiving/infrastructure/tenant-context'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export class SupabaseGoodsReceiptSearchRepository
  implements GoodsReceiptSearchRepository
{
  constructor(private readonly options: ReceivingReposOptions) {}

  async list(
    organizationId: string,
    query: ListReceiptsQuery,
  ): Promise<ListReceiptsResult> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const status = query.status ?? 'all'
    const sort = query.sort ?? 'created_desc'

    let builder = this.options.client
      .from('goods_receipt_search')
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
        .order('goods_receipt_id', { ascending: true })
    } else {
      builder = builder
        .order('created_at', { ascending: false })
        .order('goods_receipt_id', { ascending: false })
    }

    if (query.cursor) {
      const decoded = decodeListCursor(query.cursor)
      if (decoded) {
        if (sort === 'number_asc') {
          builder = builder.or(
            `number.gt.${decoded.value},and(number.eq.${decoded.value},goods_receipt_id.gt.${decoded.id})`,
          )
        } else {
          builder = builder.or(
            `created_at.lt.${decoded.value},and(created_at.eq.${decoded.value},goods_receipt_id.lt.${decoded.id})`,
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
          ? encodeListCursor(last.number, last.goods_receipt_id)
          : encodeListCursor(last.created_at, last.goods_receipt_id)
        : null

    return {
      items: page.map(mapReceiptListItem),
      nextCursor,
    }
  }

  async search(
    organizationId: string,
    query: SearchReceiptsQuery,
  ): Promise<ReceiptListItem[]> {
    const result = await this.list(organizationId, {
      q: query.q,
      status: query.status ?? 'all',
      limit: query.limit ?? 20,
      sort: 'created_desc',
    })
    return result.items
  }
}
