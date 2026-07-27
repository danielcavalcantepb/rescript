import type {
  CreateAddressInput,
  CreateContactInput,
  CreateSupplierInput,
  Supplier,
  SupplierAddress,
  SupplierContact,
  SupplierHistoryEntry,
  SupplierListItem,
  SupplierSnapshot,
  ListSuppliersQuery,
  ListSuppliersResult,
  SearchSuppliersQuery,
  UpdateAddressInput,
  UpdateContactInput,
  UpdateSupplierInput,
} from '#/modules/suppliers/domain/types'

export type SupplierRpcError = {
  code: string
  message: string
  fieldErrors?: Record<string, string>
}

export type SupplierRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: SupplierRpcError }

export type SupplierSummaryDto = SupplierListItem
export type SupplierDto = Supplier
export type SupplierContactDto = SupplierContact
export type SupplierAddressDto = SupplierAddress
export type SupplierSearchDto = SupplierListItem
export type SupplierSnapshotDto = SupplierSnapshot
export type SupplierHistoryDto = SupplierHistoryEntry

export type {
  CreateSupplierInput,
  UpdateSupplierInput,
  CreateContactInput,
  UpdateContactInput,
  CreateAddressInput,
  UpdateAddressInput,
  ListSuppliersQuery,
  ListSuppliersResult,
  SearchSuppliersQuery,
}
