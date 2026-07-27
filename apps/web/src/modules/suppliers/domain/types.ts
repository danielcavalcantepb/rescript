import type { PersonType } from '#/modules/customers/domain/document'

export type SupplierStatus = 'draft' | 'active' | 'inactive' | 'archived'
export type SupplierPersonType = PersonType

export type ContactStatus = 'active' | 'inactive' | 'archived'
export type AddressKind = 'billing' | 'shipping' | 'other'
export type AddressStatus = 'active' | 'inactive' | 'archived'

/** Aggregate root — PF or PJ, never both; type immutable after create. */
export type Supplier = {
  id: string
  organizationId: string
  personType: SupplierPersonType
  legalName: string
  tradeName: string | null
  document: string | null
  email: string | null
  phone: string | null
  city: string | null
  notes: string | null
  status: SupplierStatus
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

/** @deprecated use legalName — kept for gradual UI migration */
export type SupplierLegacyName = Supplier & { name: string }

export type SupplierListItem = {
  id: string
  legalName: string
  tradeName: string | null
  document: string | null
  email: string | null
  phone: string | null
  status: SupplierStatus
  updatedAt: string
}

export type SupplierSearchHit = SupplierListItem

export type SupplierContact = {
  id: string
  organizationId: string
  supplierId: string
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

export type SupplierAddress = {
  id: string
  organizationId: string
  supplierId: string
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

export type SupplierHistoryEntry = {
  id: string
  organizationId: string
  supplierId: string
  action: string
  fieldName: string | null
  oldValue: string | null
  newValue: string | null
  reason: string | null
  actorUserId: string
  actorIp: string | null
  createdAt: string
}

export type SupplierSnapshot = {
  supplier: Supplier
  contacts: SupplierContact[]
  addresses: SupplierAddress[]
}

export type CreateSupplierInput = {
  personType: SupplierPersonType
  legalName: string
  tradeName?: string | null
  document?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  notes?: string | null
  /** When true and document valid → create as active; else draft. */
  activate?: boolean
}

export type UpdateSupplierInput = {
  legalName?: string
  tradeName?: string | null
  document?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  notes?: string | null
}

export type CreateContactInput = {
  supplierId: string
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
  supplierId: string
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

export type ListSuppliersQuery = {
  q?: string
  status?: SupplierStatus | 'all'
  cursor?: string | null
  limit?: number
  sort?: 'name_asc' | 'updated_desc'
}

export type ListSuppliersResult = {
  items: SupplierListItem[]
  nextCursor: string | null
}

export type SearchSuppliersQuery = {
  q: string
  status?: SupplierStatus | 'all'
  limit?: number
}
