import {
  isValidDocumentDigits,
  normalizeDocumentDigits,
  type PersonType,
} from '#/modules/customers/domain/document'
import type {
  CreateAddressInput,
  CreateContactInput,
  CreateCustomerInput,
  UpdateAddressInput,
  UpdateContactInput,
  UpdateCustomerInput,
} from '#/modules/customers/domain/types'

export type FieldErrors = Record<string, string>

export const CUSTOMER_LIMITS = {
  legalName: 200,
  tradeName: 200,
  email: 254,
  phone: 40,
  city: 120,
  notes: 2000,
  roleTitle: 120,
  postalCode: 16,
  street: 200,
  number: 32,
  complement: 120,
  district: 120,
  state: 64,
} as const

/** @deprecated use normalizeDocumentDigits */
export const normalizeDocument = normalizeDocumentDigits

/** @deprecated use isValidDocumentDigits */
export function isValidDocument(
  digits: string,
  personType: PersonType,
): boolean {
  return isValidDocumentDigits(digits, personType)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateOptionalLengths(
  input: {
    legalName?: string
    tradeName?: string | null
    email?: string | null
    phone?: string | null
    city?: string | null
    notes?: string | null
  },
  errors: FieldErrors,
) {
  if (
    input.legalName !== undefined &&
    input.legalName.trim().length > CUSTOMER_LIMITS.legalName
  ) {
    errors.legalName = `Nome deve ter no máximo ${CUSTOMER_LIMITS.legalName} caracteres.`
  }
  if (
    input.tradeName !== undefined &&
    input.tradeName &&
    input.tradeName.trim().length > CUSTOMER_LIMITS.tradeName
  ) {
    errors.tradeName = `Nome fantasia deve ter no máximo ${CUSTOMER_LIMITS.tradeName} caracteres.`
  }
  if (
    input.email !== undefined &&
    input.email &&
    input.email.trim().length > CUSTOMER_LIMITS.email
  ) {
    errors.email = `E-mail deve ter no máximo ${CUSTOMER_LIMITS.email} caracteres.`
  }
  if (
    input.phone !== undefined &&
    input.phone &&
    input.phone.trim().length > CUSTOMER_LIMITS.phone
  ) {
    errors.phone = `Telefone deve ter no máximo ${CUSTOMER_LIMITS.phone} caracteres.`
  }
  if (
    input.city !== undefined &&
    input.city &&
    input.city.trim().length > CUSTOMER_LIMITS.city
  ) {
    errors.city = `Cidade deve ter no máximo ${CUSTOMER_LIMITS.city} caracteres.`
  }
  if (
    input.notes !== undefined &&
    input.notes &&
    input.notes.trim().length > CUSTOMER_LIMITS.notes
  ) {
    errors.notes = `Observações devem ter no máximo ${CUSTOMER_LIMITS.notes} caracteres.`
  }
}

export function validateCreateCustomer(input: CreateCustomerInput): FieldErrors {
  const errors: FieldErrors = {}
  const legalName = input.legalName?.trim() ?? ''
  if (legalName.length < 1) errors.legalName = 'Informe o nome do cliente.'

  if (input.personType !== 'PF' && input.personType !== 'PJ') {
    errors.personType = 'Selecione PF ou PJ.'
  }

  const document = normalizeDocumentDigits(input.document)
  if (input.activate) {
    if (!document) {
      errors.document =
        input.personType === 'PF' ? 'CPF obrigatório para ativar.' : 'CNPJ obrigatório para ativar.'
    } else if (!isValidDocumentDigits(document, input.personType)) {
      errors.document =
        input.personType === 'PF' ? 'CPF inválido.' : 'CNPJ inválido.'
    }
  } else if (document && !isValidDocumentDigits(document, input.personType)) {
    errors.document =
      input.personType === 'PF' ? 'CPF inválido.' : 'CNPJ inválido.'
  }

  const email = input.email?.trim()
  if (email && !isValidEmail(email)) errors.email = 'E-mail inválido.'

  validateOptionalLengths(input, errors)
  return errors
}

export function validateUpdateCustomer(
  input: UpdateCustomerInput,
  context?: { personType?: PersonType },
): FieldErrors {
  const errors: FieldErrors = {}
  if (input.legalName !== undefined && input.legalName.trim().length < 1) {
    errors.legalName = 'Informe o nome do cliente.'
  }

  const personType = context?.personType
  if (input.document !== undefined && input.document !== null && input.document !== '') {
    if (!personType) {
      errors.document = 'Tipo de pessoa necessário para validar o documento.'
    } else {
      const document = normalizeDocumentDigits(input.document)
      if (document && !isValidDocumentDigits(document, personType)) {
        errors.document =
          personType === 'PF' ? 'CPF inválido.' : 'CNPJ inválido.'
      }
    }
  }

  if (input.email !== undefined && input.email?.trim()) {
    if (!isValidEmail(input.email.trim())) errors.email = 'E-mail inválido.'
  }

  validateOptionalLengths(input, errors)
  return errors
}

export function validateCreateContact(input: CreateContactInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!input.name?.trim()) errors.name = 'Informe o nome do contato.'
  if (input.email?.trim() && !isValidEmail(input.email.trim())) {
    errors.email = 'E-mail inválido.'
  }
  return errors
}

export function validateUpdateContact(input: UpdateContactInput): FieldErrors {
  const errors: FieldErrors = {}
  if (input.name !== undefined && !input.name.trim()) {
    errors.name = 'Informe o nome do contato.'
  }
  if (input.email !== undefined && input.email?.trim() && !isValidEmail(input.email.trim())) {
    errors.email = 'E-mail inválido.'
  }
  return errors
}

export function validateCreateAddress(input: CreateAddressInput): FieldErrors {
  const errors: FieldErrors = {}
  if (!['billing', 'shipping', 'other'].includes(input.kind)) {
    errors.kind = 'Tipo de endereço inválido.'
  }
  if (!input.postalCode?.trim()) errors.postalCode = 'Informe o CEP.'
  if (!input.street?.trim()) errors.street = 'Informe a rua.'
  if (!input.city?.trim()) errors.city = 'Informe a cidade.'
  if (!input.state?.trim()) errors.state = 'Informe o estado.'
  return errors
}

export function validateUpdateAddress(input: UpdateAddressInput): FieldErrors {
  const errors: FieldErrors = {}
  if (input.kind !== undefined && !['billing', 'shipping', 'other'].includes(input.kind)) {
    errors.kind = 'Tipo de endereço inválido.'
  }
  if (input.postalCode !== undefined && !input.postalCode.trim()) {
    errors.postalCode = 'Informe o CEP.'
  }
  if (input.street !== undefined && !input.street.trim()) {
    errors.street = 'Informe a rua.'
  }
  if (input.city !== undefined && !input.city.trim()) {
    errors.city = 'Informe a cidade.'
  }
  if (input.state !== undefined && !input.state.trim()) {
    errors.state = 'Informe o estado.'
  }
  return errors
}

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}
