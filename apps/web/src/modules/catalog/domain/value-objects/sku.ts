import { err, ok, type DomainResult } from '#/modules/catalog/domain/errors'

/** SKU value object — belongs to Variant, never Product (ADR-0020). */
export type Sku = {
  readonly value: string
}

export const SKU_LIMITS = {
  min: 1,
  max: 64,
} as const

/** Trim + uppercase; collapse internal whitespace to single space then remove spaces? Strategy: trimmed, uppercase, no ambiguous spaces. */
export function normalizeSkuInput(raw: string): string {
  return raw.trim().replace(/\s+/g, '').toUpperCase()
}

export function createSku(raw: string): DomainResult<Sku> {
  const value = normalizeSkuInput(raw)
  if (value.length < SKU_LIMITS.min) {
    return err('invalid_sku', 'SKU é obrigatório.')
  }
  if (value.length > SKU_LIMITS.max) {
    return err(
      'invalid_sku',
      `SKU deve ter no máximo ${SKU_LIMITS.max} caracteres.`,
    )
  }
  if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(value)) {
    return err(
      'invalid_sku',
      'SKU deve conter apenas letras, números, ponto, hífen ou underscore.',
    )
  }
  return ok({ value })
}

export function skuEquals(a: Sku, b: Sku): boolean {
  return a.value === b.value
}
