import '#/modules/payable/infrastructure/assert-server-only'
import type { PayableSearchRepository } from '#/modules/payable/application/ports'
import type {
  ListPayablesQuery,
  ListPayablesResult,
  PayableListItem,
  SearchPayablesQuery,
} from '#/modules/payable/domain/types'
import type { PayableReposOptions } from '#/modules/payable/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/payable/infrastructure/errors'
import {
  decodeListCursor,
  encodeListCursor,
  sanitizeSearchTerm,
} from '#/modules/payable/infrastructure/list-helpers'
import { mapPayableListItem } from '#/modules/payable/infrastructure/mappers'
import { assertEntityOrganization } from '#/modules/payable/infrastructure/tenant-context'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

export class SupabasePayableSearchRepository implements PayableSearchRepository {
  constructor(private readonly options: PayableReposOptions) {}

  async list(
    organizationId: string,
    query: ListPayablesQuery,
  ): Promise<ListPayablesResult> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const status = query.status ?? 'all'
    const sort = query.sort ?? 'created_desc'

    let builder = this.options.client
      .from('accounts_payable_search')
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

    if (query.dueFrom) {
      builder = builder.gte('next_due_date', query.dueFrom)
    }
    if (query.dueTo) {
      builder = builder.lte('next_due_date', query.dueTo)
    }

    if (query.from) {
      builder = builder.gte('issue_date', query.from)
    }
    if (query.to) {
      builder = builder.lte('issue_date', query.to)
    }

    if (sort === 'number_asc') {
      builder = builder
        .order('number', { ascending: true })
        .order('accounts_payable_id', { ascending: true })
    } else if (sort === 'due_asc') {
      builder = builder
        .order('next_due_date', { ascending: true, nullsFirst: false })
        .order('accounts_payable_id', { ascending: true })
    } else {
      builder = builder
        .order('created_at', { ascending: false })
        .order('accounts_payable_id', { ascending: false })
    }

    if (query.cursor) {
      const decoded = decodeListCursor(query.cursor)
      if (decoded) {
        if (sort === 'number_asc') {
          builder = builder.or(
            `number.gt.${decoded.value},and(number.eq.${decoded.value},accounts_payable_id.gt.${decoded.id})`,
          )
        } else if (sort === 'due_asc') {
          builder = builder.or(
            `next_due_date.gt.${decoded.value},and(next_due_date.eq.${decoded.value},accounts_payable_id.gt.${decoded.id})`,
          )
        } else {
          builder = builder.or(
            `created_at.lt.${decoded.value},and(created_at.eq.${decoded.value},accounts_payable_id.lt.${decoded.id})`,
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
          ? encodeListCursor(last.number, last.accounts_payable_id)
          : sort === 'due_asc'
            ? encodeListCursor(last.next_due_date ?? '', last.accounts_payable_id)
            : encodeListCursor(last.created_at, last.accounts_payable_id)
        : null

    return {
      items: page.map(mapPayableListItem),
      nextCursor,
    }
  }

  async search(
    organizationId: string,
    query: SearchPayablesQuery,
  ): Promise<PayableListItem[]> {
    const result = await this.list(organizationId, {
      q: query.q,
      status: query.status ?? 'all',
      limit: query.limit ?? 20,
      sort: 'created_desc',
    })
    return result.items
  }
}
