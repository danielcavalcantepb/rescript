export type {
  Supplier,
  SupplierListItem,
  SupplierContact,
  SupplierAddress,
  SupplierHistoryEntry,
  SupplierSnapshot,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreateContactInput,
  UpdateContactInput,
  CreateAddressInput,
  UpdateAddressInput,
  ListSuppliersQuery,
  ListSuppliersResult,
  SupplierStatus,
  SupplierPersonType,
} from '#/modules/suppliers/domain/types'

export {
  validateCreateSupplier,
  validateUpdateSupplier,
  normalizeDocument,
  isValidDocument,
} from '#/modules/suppliers/domain/validation'

export {
  createSupplierDocument,
  tryCreateSupplierDocument,
  normalizeDocumentDigits,
  isValidCpf,
  isValidCnpj,
  isValidDocumentDigits,
} from '#/modules/suppliers/domain/document'

export { supplierStatusLabel } from '#/modules/suppliers/domain/lifecycle'
export { createSupplierService } from '#/modules/suppliers/application/supplier-service'
export {
  SupplierValidationError,
  SupplierPermissionError,
  SupplierNotFoundError,
  SupplierConflictError,
  SupplierArchivedError,
  supplierErrorMessage,
} from '#/modules/suppliers/application/errors'

export {
  sanitizeSearchTerm,
  encodeListCursor,
  decodeListCursor,
} from '#/modules/suppliers/infrastructure/list-helpers'
