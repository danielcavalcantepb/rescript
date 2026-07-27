import type {
  CreateAddressInput,
  CreateContactInput,
  CreateSupplierInput,
  Supplier,
  SupplierAddress,
  SupplierContact,
  SupplierHistoryEntry,
  SupplierListItem,
  ListSuppliersQuery,
  ListSuppliersResult,
  SearchSuppliersQuery,
  UpdateAddressInput,
  UpdateContactInput,
  UpdateSupplierInput,
} from '#/modules/suppliers/domain/types'

export type SupplierRepository = {
  getById(organizationId: string, id: string): Promise<Supplier | null>
  create(
    organizationId: string,
    userId: string,
    input: CreateSupplierInput & { status: Supplier['status']; document: string | null },
  ): Promise<Supplier>
  update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateSupplierInput & { document?: string | null },
  ): Promise<Supplier>
  setStatus(
    organizationId: string,
    userId: string,
    id: string,
    status: Supplier['status'],
    archive?: { archivedAt: string | null; archivedBy: string | null },
  ): Promise<Supplier>
}

export type SupplierSearchRepository = {
  list(
    organizationId: string,
    query: ListSuppliersQuery,
  ): Promise<ListSuppliersResult>
  search(
    organizationId: string,
    query: SearchSuppliersQuery,
  ): Promise<SupplierListItem[]>
}

export type SupplierContactRepository = {
  listBySupplier(
    organizationId: string,
    supplierId: string,
  ): Promise<SupplierContact[]>
  getById(
    organizationId: string,
    id: string,
  ): Promise<SupplierContact | null>
  create(
    organizationId: string,
    userId: string,
    input: CreateContactInput,
  ): Promise<SupplierContact>
  update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateContactInput,
  ): Promise<SupplierContact>
  softRemove(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<SupplierContact>
  clearPrimary(
    organizationId: string,
    supplierId: string,
    exceptId?: string,
  ): Promise<void>
}

export type SupplierAddressRepository = {
  listBySupplier(
    organizationId: string,
    supplierId: string,
  ): Promise<SupplierAddress[]>
  getById(
    organizationId: string,
    id: string,
  ): Promise<SupplierAddress | null>
  create(
    organizationId: string,
    userId: string,
    input: CreateAddressInput,
  ): Promise<SupplierAddress>
  update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateAddressInput,
  ): Promise<SupplierAddress>
  softRemove(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<SupplierAddress>
  clearPrimaryForKind(
    organizationId: string,
    supplierId: string,
    kind: SupplierAddress['kind'],
    exceptId?: string,
  ): Promise<void>
}

export type SupplierHistoryRepository = {
  append(
    organizationId: string,
    entry: {
      supplierId: string
      action: string
      fieldName?: string | null
      oldValue?: string | null
      newValue?: string | null
      reason?: string | null
      actorUserId: string
      actorIp?: string | null
    },
  ): Promise<SupplierHistoryEntry>
  listBySupplier(
    organizationId: string,
    supplierId: string,
    limit?: number,
  ): Promise<SupplierHistoryEntry[]>
}

/** @deprecated prefer typed ports above */
export type { SupplierRepository as LegacySupplierRepositoryShape }
