import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@rescript/database'
type CustomerUpdate = Database['public']['Tables']['customer']['Update']
import { createBrowserSupabaseClient } from '#/lib/supabase/client'
import { normalizeDocument } from '#/modules/customers/domain/validation'
import type {
  CreateCustomerInput,
  Customer,
  CustomerRepository,
  ListCustomersQuery,
  ListCustomersResult,
  UpdateCustomerInput,
} from '#/modules/customers/domain/types'
import {
  asCustomerRow,
  mapCustomer,
  mapCustomerListItem,
} from '#/modules/customers/infrastructure/mappers'

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

export class SupabaseCustomerRepository implements CustomerRepository {
  constructor(
    private readonly client: SupabaseClient<Database> = createBrowserSupabaseClient(),
  ) {}

  async list(
    organizationId: string,
    query: ListCustomersQuery,
  ): Promise<ListCustomersResult> {
    const limit = Math.min(query.limit ?? DEFAULT_LIMIT, MAX_LIMIT)
    const status = query.status ?? 'active'
    const sort = query.sort ?? 'name_asc'

    let builder = this.client
      .from('customer')
      .select('*')
      .eq('organization_id', organizationId)

    if (status !== 'all') {
      builder = builder.eq('status', status)
    }

    const q = query.q ? sanitizeSearchTerm(query.q) : ''
    if (q) {
      const digits = q.replace(/\D/g, '')
      // Double-quote values so spaces / reserved chars stay inside PostgREST filters.
      const pattern = `"%${q}%"`
      if (digits.length >= 3) {
        builder = builder.or(
          `name.ilike.${pattern},trade_name.ilike.${pattern},document.ilike."%${digits}%",city.ilike.${pattern},email.ilike.${pattern}`,
        )
      } else {
        builder = builder.or(
          `name.ilike.${pattern},trade_name.ilike.${pattern},city.ilike.${pattern},email.ilike.${pattern}`,
        )
      }
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

    const rows = (data ?? []).map(asCustomerRow)
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
      items: page.map(mapCustomerListItem),
      nextCursor,
    }
  }

  async getById(organizationId: string, id: string): Promise<Customer | null> {
    const { data, error } = await this.client
      .from('customer')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? mapCustomer(data) : null
  }

  async create(
    organizationId: string,
    userId: string,
    input: CreateCustomerInput,
  ): Promise<Customer> {
    const row = {
      organization_id: organizationId,
      name: input.name.trim(),
      trade_name: input.tradeName?.trim() || null,
      person_type: input.personType,
      document: normalizeDocument(input.document),
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      city: input.city?.trim() || null,
      notes: input.notes?.trim() || null,
      status: 'active' as const,
      created_by: userId,
      updated_by: userId,
    }

    const { data, error } = await this.client
      .from('customer')
      .insert(row)
      .select('*')
      .single()

    if (error) throw error
    return mapCustomer(data)
  }

  async update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer> {
    const patch: CustomerUpdate = { updated_by: userId }
    if (input.name !== undefined) patch.name = input.name.trim()
    if (input.tradeName !== undefined)
      patch.trade_name = input.tradeName?.trim() || null
    if (input.personType !== undefined) patch.person_type = input.personType
    if (input.document !== undefined)
      patch.document = normalizeDocument(input.document)
    if (input.email !== undefined) patch.email = input.email?.trim() || null
    if (input.phone !== undefined) patch.phone = input.phone?.trim() || null
    if (input.city !== undefined) patch.city = input.city?.trim() || null
    if (input.notes !== undefined) patch.notes = input.notes?.trim() || null

    const { data, error } = await this.client
      .from('customer')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return mapCustomer(data)
  }

  async archive(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<Customer> {
    const { data, error } = await this.client
      .from('customer')
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
    return mapCustomer(data)
  }

  async restore(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<Customer> {
    const { data, error } = await this.client
      .from('customer')
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
    return mapCustomer(data)
  }
}

export const supabaseCustomerRepository = new SupabaseCustomerRepository()
