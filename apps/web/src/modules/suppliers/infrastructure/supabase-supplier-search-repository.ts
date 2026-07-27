import '#/modules/suppliers/infrastructure/assert-server-only'
import type { SupplierSearchRepository } from '#/modules/suppliers/application/ports'
import type {
  SupplierListItem,
  ListSuppliersQuery,
  ListSuppliersResult,
  SearchSuppliersQuery,
} from '#/modules/suppliers/domain/types'
import type { SupplierReposOptions } from '#/modules/suppliers/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/suppliers/infrastructure/errors'
import {
  decodeListCursor,
  encodeListCursor,
  sanitizeSearchTerm,
} from '#/modules/suppliers/infrastructure/list-helpers'
import { mapSupplierListItem } from '#/modules/suppliers/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/suppliers/infrastructure/tenant-context'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export class SupabaseSupplierSearchRepository
  implements SupplierSearchRepository
{
  constructor(private readonly options: SupplierReposOptions) {}

  async list(
    organizationId: string,
    query: ListSuppliersQuery,
  ): Promise<ListSuppliersResult> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const status = query.status ?? 'active'
    const sort = query.sort ?? 'name_asc'

    let builder = this.options.client
      .from('supplier_search')
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
          `search_text.ilike.${pattern},document_digits.ilike."%${digits}%"`,
        )
      } else {
        builder = builder.ilike('search_text', `%${q.toLowerCase()}%`)
      }
    }

    if (sort === 'updated_desc') {
      builder = builder
        .order('updated_at', { ascending: false })
        .order('supplier_id', { ascending: false })
    } else {
      builder = builder
        .order('legal_name', { ascending: true })
        .order('supplier_id', { ascending: true })
    }

    if (query.cursor) {
      const decoded = decodeListCursor(query.cursor)
      if (decoded) {
        if (sort === 'updated_desc') {
          builder = builder.or(
            `updated_at.lt.${decoded.value},and(updated_at.eq.${decoded.value},supplier_id.lt.${decoded.id})`,
          )
        } else {
          builder = builder.or(
            `legal_name.gt.${decoded.value},and(legal_name.eq.${decoded.value},supplier_id.gt.${decoded.id})`,
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
        ? sort === 'updated_desc'
          ? encodeListCursor(last.updated_at, last.supplier_id)
          : encodeListCursor(last.legal_name, last.supplier_id)
        : null

    return {
      items: page.map(mapSupplierListItem),
      nextCursor,
    }
  }

  async search(
    organizationId: string,
    query: SearchSuppliersQuery,
  ): Promise<SupplierListItem[]> {
    const result = await this.list(organizationId, {
      q: query.q,
      status: query.status ?? 'all',
      limit: query.limit ?? 20,
      sort: 'name_asc',
    })
    return result.items
  }
}
