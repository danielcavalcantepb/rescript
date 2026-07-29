import type { PersonType } from '#/modules/customers/domain/document'

export type CustomerStatus = 'draft' | 'active' | 'inactive' | 'archived'
export type CustomerPersonType = PersonType

export type ContactStatus = 'active' | 'inactive' | 'archived'
export type AddressKind = 'billing' | 'shipping' | 'other'
export type AddressStatus = 'active' | 'inactive' | 'archived'

/** Aggregate root — PF or PJ, never both; type immutable after create. */
export type Customer = {
  id: string
  organizationId: string
  companyId?: string
  branchId?: string
  personType: CustomerPersonType
  legalName: string
  shortName?: string
  tradeName: string | null
  document: string | null
  email: string | null
  phone: string | null
  secondaryPhone?: string | null
  commercialPhone?: string | null
  instagram?: string | null
  acquisitionSourceId?: string | null
  acquisitionSourceOther?: string | null
  gender?: string | null
  birthDay?: number | null
  birthMonth?: number | null
  rg?: string | null
  stateRegistration?: string | null
  municipalRegistration?: string | null
  legalRepresentative?: string | null
  city?: string | null
  notes: string | null
  status: CustomerStatus
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

/** @deprecated use legalName — kept for gradual UI migration */
export type CustomerLegacyName = Customer & { name: string }

export type CustomerListItem = {
  id: string
  legalName: string
  tradeName: string | null
  document: string | null
  email: string | null
  phone: string | null
  city?: string | null
  status: CustomerStatus
  updatedAt: string
}

export type CustomerSearchHit = CustomerListItem

export type CustomerContact = {
  id: string
  organizationId: string
  customerId: string
  name: string
  roleTitle: string | null
  email: string | null
  phone: string | null
  isPrimary: boolean
  status: ContactStatus
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CustomerAddress = {
  id: string
  organizationId: string
  customerId: string
  kind: AddressKind
  postalCode: string
  street: string
  number: string | null
  complement: string | null
  district: string | null
  city: string
  state: string
  country: string
  isPrimary: boolean
  status: AddressStatus
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type CustomerHistoryEntry = {
  id: string
  organizationId: string
  customerId: string
  action: string
  fieldName: string | null
  oldValue: string | null
  newValue: string | null
  reason: string | null
  actorUserId: string
  actorIp: string | null
  createdAt: string
}

export type CustomerSnapshot = {
  customer: Customer
  contacts: CustomerContact[]
  addresses: CustomerAddress[]
}

export type CreateCustomerInput = {
  personType: CustomerPersonType
  legalName: string
  shortName?: string | null
  tradeName?: string | null
  document?: string | null
  email?: string | null
  phone?: string | null
  secondaryPhone?: string | null
  commercialPhone?: string | null
  instagram?: string | null
  acquisitionSourceId?: string | null
  acquisitionSourceOther?: string | null
  gender?: string | null
  birthDay?: number | null
  birthMonth?: number | null
  rg?: string | null
  stateRegistration?: string | null
  municipalRegistration?: string | null
  legalRepresentative?: string | null
  city?: string | null
  notes?: string | null
  /** When true and document valid → create as active; else draft. */
  activate?: boolean
}

export type UpdateCustomerInput = {
  legalName?: string
  shortName?: string | null
  tradeName?: string | null
  document?: string | null
  email?: string | null
  phone?: string | null
  secondaryPhone?: string | null
  commercialPhone?: string | null
  instagram?: string | null
  acquisitionSourceId?: string | null
  acquisitionSourceOther?: string | null
  gender?: string | null
  birthDay?: number | null
  birthMonth?: number | null
  rg?: string | null
  stateRegistration?: string | null
  municipalRegistration?: string | null
  legalRepresentative?: string | null
  city?: string | null
  notes?: string | null
}

export type CreateContactInput = {
  customerId: string
  name: string
  roleTitle?: string | null
  email?: string | null
  phone?: string | null
  isPrimary?: boolean
}

export type UpdateContactInput = {
  name?: string
  roleTitle?: string | null
  email?: string | null
  phone?: string | null
  isPrimary?: boolean
  status?: Exclude<ContactStatus, 'archived'>
}

export type CreateAddressInput = {
  customerId: string
  kind: AddressKind
  postalCode: string
  street: string
  number?: string | null
  complement?: string | null
  district?: string | null
  city: string
  state: string
  country?: string
  isPrimary?: boolean
}

export type UpdateAddressInput = {
  kind?: AddressKind
  postalCode?: string
  street?: string
  number?: string | null
  complement?: string | null
  district?: string | null
  city?: string
  state?: string
  country?: string
  isPrimary?: boolean
  status?: Exclude<AddressStatus, 'archived'>
}

export type ListCustomersQuery = {
  q?: string
  status?: CustomerStatus | 'all'
  cursor?: string | null
  limit?: number
  sort?: 'name_asc' | 'updated_desc'
}

export type ListCustomersResult = {
  items: CustomerListItem[]
  nextCursor: string | null
}

export type SearchCustomersQuery = {
  q: string
  status?: CustomerStatus | 'all'
  limit?: number
}
