import type { CustomerRow } from '@rescript/database'
import type { Customer, CustomerListItem } from '#/modules/customers/domain/types'

export function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    tradeName: row.trade_name,
    personType: row.person_type,
    document: row.document,
    email: row.email,
    phone: row.phone,
    city: row.city,
    notes: row.notes,
    status: row.status,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
