import type {
  CustomerPersonType,
  CustomerRow,
  CustomerStatus,
  Tables,
} from '@rescript/database'
import type { Customer, CustomerListItem } from '#/modules/customers/domain/types'

/** Narrow CLI-generated string columns to domain CHECK unions. */
export function asCustomerRow(row: Tables<'customer'>): CustomerRow {
  return row as CustomerRow
}

export function mapCustomer(row: Tables<'customer'> | CustomerRow): Customer {
  const r = asCustomerRow(row)
  return {
    id: r.id,
    organizationId: r.organization_id,
    name: r.name,
    tradeName: r.trade_name,
    personType: r.person_type as CustomerPersonType,
    document: r.document,
    email: r.email,
    phone: r.phone,
    city: r.city,
    notes: r.notes,
    status: r.status as CustomerStatus,
    archivedAt: r.archived_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function mapCustomerListItem(row: CustomerRow): CustomerListItem {
  const c = mapCustomer(row)
  return {
    id: c.id,
    name: c.name,
    tradeName: c.tradeName,
    document: c.document,
    city: c.city,
    status: c.status,
    updatedAt: c.updatedAt,
  }
}
