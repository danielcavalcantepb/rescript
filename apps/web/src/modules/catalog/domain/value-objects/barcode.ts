import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'

export const BARCODE_TYPES = [
  'EAN_8',
  'EAN_13',
  'UPC_A',
  'GTIN_14',
  'internal',
] as const

export type BarcodeType = (typeof BARCODE_TYPES)[number]

/** Barcode value object (format). VariantBarcode entity wraps this. */
export type Barcode = {
  readonly type: BarcodeType
  readonly value: string
}

export const BARCODE_LIMITS = {
  max: 32,
} as const

function onlyDigits(value: string): boolean {
  return /^\d+$/.test(value)
}

/**
 * GS1 check digit (mod-10) for the body without check digit.
 * From the right, weights alternate 3, 1, 3, 1, …
 */
export function gs1CheckDigit(bodyWithoutCheck: string): number {
  let sum = 0
  const digits = bodyWithoutCheck.split('').map(Number)
  for (let i = digits.length - 1, pos = 0; i >= 0; i--, pos++) {
    const weight = pos % 2 === 0 ? 3 : 1
    sum += digits[i]! * weight
  }
  return (10 - (sum % 10)) % 10
}

function assertGs1(value: string, length: number): boolean {
  if (!onlyDigits(value) || value.length !== length) return false
  const body = value.slice(0, -1)
  const check = Number(value.slice(-1))
  return gs1CheckDigit(body) === check
}

export function normalizeBarcodeInput(raw: string): string {
  return raw.trim().replace(/\s+/g, '')
}

export function createBarcode(
  type: BarcodeType,
  raw: string,
): DomainResult<Barcode> {
  const value = normalizeBarcodeInput(raw)
  if (value.length < 1) {
    return err('invalid_barcode', 'Código de barras é obrigatório.')
  }
  if (value.length > BARCODE_LIMITS.max) {
    return err(
      'invalid_barcode',
      `Código de barras deve ter no máximo ${BARCODE_LIMITS.max} caracteres.`,
    )
  }

  switch (type) {
    case 'EAN_8':
      if (!assertGs1(value, 8)) {
        return err('invalid_barcode', 'EAN-8 inválido (formato ou dígito verificador).')
      }
      break
    case 'EAN_13':
      if (!assertGs1(value, 13)) {
        return err(
          'invalid_barcode',
          'EAN-13 inválido (formato ou dígito verificador).',
        )
      }
      break
    case 'UPC_A':
      if (!assertGs1(value, 12)) {
        return err('invalid_barcode', 'UPC-A inválido (formato ou dígito verificador).')
      }
      break
    case 'GTIN_14':
      if (!assertGs1(value, 14)) {
        return err(
          'invalid_barcode',
          'GTIN-14 inválido (formato ou dígito verificador).',
        )
      }
      break
    case 'internal':
      if (!/^[A-Za-z0-9._-]+$/.test(value)) {
        return err(
          'invalid_barcode',
          'Código interno deve conter apenas letras, números, ponto, hífen ou underscore.',
        )
      }
      break
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }

  return ok({ type, value })
}

export function barcodeEquals(a: Barcode, b: Barcode): boolean {
  return a.type === b.type && a.value === b.value
}
