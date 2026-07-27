import type { Tables } from '@rescript/database'
import type {
  AddressKind,
  AddressStatus,
  ContactStatus,
  Supplier,
  SupplierAddress,
  SupplierContact,
  SupplierHistoryEntry,
  SupplierListItem,
  SupplierPersonType,
  SupplierStatus,
} from '#/modules/suppliers/domain/types'

export function mapSupplier(row: Tables<'supplier'>): Supplier {
  return {
    id: row.id,
    organizationId: row.organization_id,
    personType: row.person_type as SupplierPersonType,
    legalName: row.name,
    tradeName: row.trade_name,
    document: row.document,
    email: row.email,
    phone: row.phone,
    city: row.city,
    notes: row.notes,
    status: row.status as SupplierStatus,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapSupplierListItem(
  row: Tables<'supplier_search'> | Tables<'supplier'>,
): SupplierListItem {
  if ('legal_name' in row) {
    return {
      id: row.supplier_id,
      legalName: row.legal_name,
      tradeName: row.trade_name,
      document: row.document_digits,
      email: row.email,
      phone: row.phone,
      status: row.status as SupplierStatus,
      updatedAt: row.updated_at,
    }
  }
  const c = mapSupplier(row)
  return {
    id: c.id,
    legalName: c.legalName,
    tradeName: c.tradeName,
    document: c.document,
    email: c.email,
    phone: c.phone,
    status: c.status,
    updatedAt: c.updatedAt,
  }
}

export function mapContact(row: Tables<'supplier_contact'>): SupplierContact {
  return {
    id: row.id,
    organizationId: row.organization_id,
    supplierId: row.supplier_id,
    name: row.name,
    roleTitle: row.role_title,
    email: row.email,
    phone: row.phone,
    isPrimary: row.is_primary,
    status: row.status as ContactStatus,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapAddress(row: Tables<'supplier_address'>): SupplierAddress {
  return {
    id: row.id,
    organizationId: row.organization_id,
    supplierId: row.supplier_id,
    kind: row.kind as AddressKind,
    postalCode: row.postal_code,
    street: row.street,
    number: row.number,
    complement: row.complement,
    district: row.district,
    city: row.city,
    state: row.state,
    country: row.country,
    isPrimary: row.is_primary,
    status: row.status as AddressStatus,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapHistory(row: Tables<'supplier_history'>): SupplierHistoryEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    supplierId: row.supplier_id,
    action: row.action,
    fieldName: row.field_name,
    oldValue: row.old_value,
    newValue: row.new_value,
    reason: row.reason,
    actorUserId: row.actor_user_id,
    actorIp: row.actor_ip,
    createdAt: row.created_at,
  }
}
