/** Brazilian tax document value objects — digits only, never masked. */

export type PersonType = 'PF' | 'PJ'

export type CustomerDocument = {
  readonly personType: PersonType
  readonly digits: string
}

export function normalizeDocumentDigits(
  value: string | null | undefined,
): string | null {
  if (!value) return null
  const digits = value.replace(/\D/g, '')
  return digits.length ? digits : null
}

function calcCpfDigit(base: string, factor: number): number {
  let sum = 0
  for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (factor - i)
  const mod = (sum * 10) % 11
  return mod === 10 ? 0 : mod
}

export function isValidCpf(digits: string): boolean {
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false
  const d1 = calcCpfDigit(digits.slice(0, 9), 10)
  const d2 = calcCpfDigit(digits.slice(0, 10), 11)
  return d1 === Number(digits[9]) && d2 === Number(digits[10])
}

function calcCnpjDigit(base: string, weights: number[]): number {
  const sum = base
    .split('')
    .reduce((acc, n, i) => acc + Number(n) * weights[i]!, 0)
  const mod = sum % 11
  return mod < 2 ? 0 : 11 - mod
}

export function isValidCnpj(digits: string): boolean {
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const d1 = calcCnpjDigit(digits.slice(0, 12), w1)
  const d2 = calcCnpjDigit(digits.slice(0, 13), w2)
  return d1 === Number(digits[12]) && d2 === Number(digits[13])
}

export function isValidDocumentDigits(
  digits: string,
  personType: PersonType,
): boolean {
  return personType === 'PF' ? isValidCpf(digits) : isValidCnpj(digits)
}

/** Parse + validate a CPF (PF) or CNPJ (PJ). Throws on invalid. */
export function createCustomerDocument(
  personType: PersonType,
  raw: string | null | undefined,
): CustomerDocument {
  const digits = normalizeDocumentDigits(raw)
  if (!digits) {
    throw new Error(
      personType === 'PF' ? 'cpf_required' : 'cnpj_required',
    )
  }
  if (!isValidDocumentDigits(digits, personType)) {
    throw new Error(personType === 'PF' ? 'cpf_invalid' : 'cnpj_invalid')
  }
  return { personType, digits }
}

export function tryCreateCustomerDocument(
  personType: PersonType,
  raw: string | null | undefined,
): CustomerDocument | null {
  const digits = normalizeDocumentDigits(raw)
  if (!digits) return null
  if (!isValidDocumentDigits(digits, personType)) {
    throw new Error(personType === 'PF' ? 'cpf_invalid' : 'cnpj_invalid')
  }
  return { personType, digits }
}
