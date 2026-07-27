/**
 * Supplier documents reuse Customer CPF/CNPJ value objects exactly.
 * Do not duplicate validation algorithms.
 */
export {
  type PersonType,
  type CustomerDocument as SupplierDocument,
  normalizeDocumentDigits,
  isValidCpf,
  isValidCnpj,
  isValidDocumentDigits,
  createCustomerDocument as createSupplierDocument,
  tryCreateCustomerDocument as tryCreateSupplierDocument,
  createCustomerDocument,
  tryCreateCustomerDocument,
} from '#/modules/customers/domain/document'
