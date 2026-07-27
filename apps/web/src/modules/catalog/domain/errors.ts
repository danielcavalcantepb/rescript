/** Catalog domain error codes — no infrastructure. */
export const CATALOG_ERROR_CODES = [
  'invalid_sku',
  'invalid_barcode',
  'invalid_money',
  'invalid_quantity',
  'invalid_name',
  'invalid_status_transition',
  'invariant_violation',
  'missing_default_variant',
  'unexpected_default_variant',
  'variant_requires_product',
  'duplicate_combination',
  'axis_limit_exceeded',
  'variant_limit_exceeded',
  'combination_limit_exceeded',
  'invalid_axis_type',
  'incomplete_combination',
  'topology_locked',
  'activation_blocked',
  'price_required',
  'sku_required',
  'uom_required',
  'duplicate_sku',
  'duplicate_barcode',
  'category_depth_exceeded',
  'category_cycle',
] as const

export type CatalogErrorCode = (typeof CATALOG_ERROR_CODES)[number]

export type CatalogDomainError = {
  code: CatalogErrorCode
  message: string
}

export function catalogError(
  code: CatalogErrorCode,
  message: string,
): CatalogDomainError {
  return { code, message }
}

export type DomainResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: CatalogDomainError }

export function ok<T>(value: T): DomainResult<T> {
  return { ok: true, value }
}

export function err<T = never>(
  code: CatalogErrorCode,
  message: string,
): DomainResult<T> {
  return { ok: false, error: catalogError(code, message) }
}
