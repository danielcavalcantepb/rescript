import '#/modules/customers/infrastructure/assert-server-only'
import type { CustomerSearchRepository } from '#/modules/customers/application/ports'
import type {
  CustomerListItem,
  ListCustomersQuery,
  ListCustomersResult,
  SearchCustomersQuery,
} from '#/modules/customers/domain/types'
import type { CustomerReposOptions } from '#/modules/customers/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/customers/infrastructure/errors'
import {
  decodeListCursor,
  encodeListCursor,
  sanitizeSearchTerm,
} from '#/modules/customers/infrastructure/list-helpers'
import { mapCustomerListItem } from '#/modules/customers/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/customers/infrastructure/tenant-context'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export class SupabaseCustomerSearchRepository
  implements CustomerSearchRepository
{
  constructor(private readonly options: CustomerReposOptions) {}

  async list(
    organizationId: string,
    query: ListCustomersQuery,
  ): Promise<ListCustomersResult> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const status = query.status ?? 'active'
    const sort = query.sort ?? 'name_asc'

    let builder = this.options.client
      .from('customer_search')
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
        .order('customer_id', { ascending: false })
    } else {
      builder = builder
        .order('legal_name', { ascending: true })
        .order('customer_id', { ascending: true })
    }

    if (query.cursor) {
      const decoded = decodeListCursor(query.cursor)
      if (decoded) {
        if (sort === 'updated_desc') {
          builder = builder.or(
            `updated_at.lt.${decoded.value},and(updated_at.eq.${decoded.value},customer_id.lt.${decoded.id})`,
          )
        } else {
          builder = builder.or(
            `legal_name.gt.${decoded.value},and(legal_name.eq.${decoded.value},customer_id.gt.${decoded.id})`,
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
          ? encodeListCursor(last.updated_at, last.customer_id)
          : encodeListCursor(last.legal_name, last.customer_id)
        : null

    return {
      items: page.map(mapCustomerListItem),
      nextCursor,
    }
  }

  async search(
    organizationId: string,
    query: SearchCustomersQuery,
  ): Promise<CustomerListItem[]> {
    const result = await this.list(organizationId, {
      q: query.q,
      status: query.status ?? 'all',
      limit: query.limit ?? 20,
      sort: 'name_asc',
    })
    return result.items
  }
}
