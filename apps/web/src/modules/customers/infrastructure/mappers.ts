import type { Tables } from '@rescript/database'
import type {
  AddressKind,
  AddressStatus,
  ContactStatus,
  Customer,
  CustomerAddress,
  CustomerContact,
  CustomerHistoryEntry,
  CustomerListItem,
  CustomerPersonType,
  CustomerStatus,
} from '#/modules/customers/domain/types'

export function mapCustomer(row: Tables<'customer'>): Customer {
  return {
    id: row.id,
    organizationId: row.organization_id,
    companyId: row.company_id,
    branchId: row.branch_id,
    personType: row.person_type as CustomerPersonType,
    legalName: row.name,
    shortName: row.short_name,
    tradeName: row.trade_name,
    document: row.document,
    email: row.email,
    phone: row.phone,
    secondaryPhone: row.secondary_phone,
    commercialPhone: row.commercial_phone,
    instagram: row.instagram,
    acquisitionSourceId: row.acquisition_source_id,
    acquisitionSourceOther: row.acquisition_source_other,
    gender: row.gender,
    birthDay: row.birth_day,
    birthMonth: row.birth_month,
    rg: row.rg,
    stateRegistration: row.state_registration,
    municipalRegistration: row.municipal_registration,
    legalRepresentative: row.legal_representative,
    city: row.city,
    notes: row.notes,
    status: row.status as CustomerStatus,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapCustomerListItem(
  row: Tables<'customer_search'> | Tables<'customer'>,
): CustomerListItem {
  if ('legal_name' in row) {
    return {
      id: row.customer_id,
      legalName: row.legal_name,
      tradeName: row.trade_name,
      document: row.document_digits,
      email: row.email,
      phone: row.phone,
      city: null,
      status: row.status as CustomerStatus,
      updatedAt: row.updated_at,
    }
  }
  const c = mapCustomer(row)
  return {
    id: c.id,
    legalName: c.legalName,
    tradeName: c.tradeName,
    document: c.document,
    email: c.email,
    phone: c.phone,
    city: c.city,
    status: c.status,
    updatedAt: c.updatedAt,
  }
}

export function mapContact(row: Tables<'customer_contact'>): CustomerContact {
  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
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

export function mapAddress(row: Tables<'customer_address'>): CustomerAddress {
  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
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

export function mapHistory(row: Tables<'customer_history'>): CustomerHistoryEntry {
  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
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
