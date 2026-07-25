export type {
  Customer,
  CustomerListItem,
  CreateCustomerInput,
  UpdateCustomerInput,
  ListCustomersQuery,
  ListCustomersResult,
  CustomerRepository,
} from '#/modules/customers/domain/types'
export {
  validateCreateCustomer,
  validateUpdateCustomer,
  normalizeDocument,
  isValidDocument,
} from '#/modules/customers/domain/validation'
export { createCustomer } from '#/modules/customers/application/create-customer'
export { updateCustomer } from '#/modules/customers/application/update-customer'
export { archiveCustomer } from '#/modules/customers/application/archive-customer'
export { restoreCustomer } from '#/modules/customers/application/restore-customer'
export { getCustomer } from '#/modules/customers/application/get-customer'
export {
  listCustomers,
  searchCustomers,
} from '#/modules/customers/application/list-customers'
export {
  CustomerValidationError,
  CustomerPermissionError,
  CustomerNotFoundError,
  CustomerConflictError,
  CustomerArchivedError,
  customerErrorMessage,
} from '#/modules/customers/application/errors'
export {
  SupabaseCustomerRepository,
  supabaseCustomerRepository,
} from '#/modules/customers/infrastructure/supabase-customer-repository'
