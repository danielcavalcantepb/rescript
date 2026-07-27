export type {
  Customer,
  CustomerListItem,
  CustomerContact,
  CustomerAddress,
  CustomerHistoryEntry,
  CustomerSnapshot,
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateContactInput,
  UpdateContactInput,
  CreateAddressInput,
  UpdateAddressInput,
  ListCustomersQuery,
  ListCustomersResult,
  CustomerStatus,
  CustomerPersonType,
} from '#/modules/customers/domain/types'

export {
  validateCreateCustomer,
  validateUpdateCustomer,
  normalizeDocument,
  isValidDocument,
} from '#/modules/customers/domain/validation'

export {
  createCustomerDocument,
  tryCreateCustomerDocument,
  normalizeDocumentDigits,
  isValidCpf,
  isValidCnpj,
  isValidDocumentDigits,
} from '#/modules/customers/domain/document'

export { customerStatusLabel } from '#/modules/customers/domain/lifecycle'
export { createCustomerService } from '#/modules/customers/application/customer-service'
export {
  CustomerValidationError,
  CustomerPermissionError,
  CustomerNotFoundError,
  CustomerConflictError,
  CustomerArchivedError,
  customerErrorMessage,
} from '#/modules/customers/application/errors'

export {
  sanitizeSearchTerm,
  encodeListCursor,
  decodeListCursor,
} from '#/modules/customers/infrastructure/list-helpers'
