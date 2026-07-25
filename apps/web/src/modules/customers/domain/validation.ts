import type { CreateCustomerInput, UpdateCustomerInput } from '#/modules/customers/domain/types'

export type FieldErrors = Record<string, string>

export const CUSTOMER_LIMITS = {
  name: 200,
  tradeName: 200,
  email: 254,
  phone: 40,
  city: 120,
  notes: 2000,
} as const

export function normalizeDocument(value: string | null | undefined): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  return digits.length ? digits : null
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/** Basic CPF/CNPJ length + checksum (BR). */
export function isValidDocument(digits: string, personType: 'PF' | 'PJ'): boolean {
  if (personType === 'PF') {
    if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false
    const calc = (base: string, factor: number) => {
      let sum = 0
      for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (factor - i)
      const mod = (sum * 10) % 11
      return mod === 10 ? 0 : mod
    }
    const d1 = calc(digits.slice(0, 9), 10)
    const d2 = calc(digits.slice(0, 10), 11)
    return d1 === Number(digits[9]) && d2 === Number(digits[10])
  }
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false
  const calc = (base: string, weights: number[]) => {
    const sum = base
      .split('')
      .reduce((acc, n, i) => acc + Number(n) * weights[i]!, 0)
    const mod = sum % 11
    return mod < 2 ? 0 : 11 - mod
  }
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const d1 = calc(digits.slice(0, 12), w1)
  const d2 = calc(digits.slice(0, 13), w2)
  return d1 === Number(digits[12]) && d2 === Number(digits[13])
}

function validateOptionalLengths(
  input: Partial<CreateCustomerInput>,
  errors: FieldErrors,
) {
  if (input.name !== undefined && input.name.trim().length > CUSTOMER_LIMITS.name) {
    errors.name = `Nome deve ter no máximo ${CUSTOMER_LIMITS.name} caracteres.`
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
  const name = input.name?.trim() ?? ''
  if (name.length < 1) errors.name = 'Informe o nome do cliente.'

  if (input.personType !== 'PF' && input.personType !== 'PJ') {
    errors.personType = 'Selecione PF ou PJ.'
  }

  const document = normalizeDocument(input.document)
  if (document) {
    if (!isValidDocument(document, input.personType)) {
      errors.document =
        input.personType === 'PF' ? 'CPF inválido.' : 'CNPJ inválido.'
    }
  }

  const email = input.email?.trim()
  if (email && !isValidEmail(email)) {
    errors.email = 'E-mail inválido.'
  }

  validateOptionalLengths(input, errors)
  return errors
}

export function validateUpdateCustomer(
  input: UpdateCustomerInput,
  context?: { personType?: 'PF' | 'PJ' },
): FieldErrors {
  const errors: FieldErrors = {}
  if (input.name !== undefined && input.name.trim().length < 1) {
    errors.name = 'Informe o nome do cliente.'
  }
  if (
    input.personType !== undefined &&
    input.personType !== 'PF' &&
    input.personType !== 'PJ'
  ) {
    errors.personType = 'Selecione PF ou PJ.'
  }

  const personType = input.personType ?? context?.personType
  if (input.document !== undefined && input.document !== null && input.document !== '') {
    if (!personType) {
      errors.document = 'Selecione PF ou PJ para validar o documento.'
    } else {
      const document = normalizeDocument(input.document)
      if (document && !isValidDocument(document, personType)) {
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

export function hasFieldErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0
}
