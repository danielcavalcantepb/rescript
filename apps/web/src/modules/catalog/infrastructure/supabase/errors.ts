import {
  CatalogConflictError,
  CatalogNotFoundError,
  CatalogPermissionError,
} from '#/modules/catalog/application/errors'
import { redactSensitive } from '#/modules/catalog/infrastructure/supabase/tenant-context'

type PgLikeError = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

function errorText(error: unknown): string {
  if (typeof error !== 'object' || !error) return String(error ?? '')
  const e = error as PgLikeError
  return redactSensitive(
    [e.message, e.details, e.hint, e.code].filter(Boolean).join(' '),
  ).toLowerCase()
}

function errorCode(error: unknown): string {
  if (typeof error !== 'object' || !error || !('code' in error)) return ''
  return String((error as PgLikeError).code ?? '')
}

function conflictMessage(error: unknown): string {
  const text = errorText(error)
  if (text.includes('sku') || text.includes('product_variant_org_sku')) {
    return 'sku_conflict'
  }
  if (text.includes('barcode') || text.includes('product_variant_barcode')) {
    return 'barcode_conflict'
  }
  if (text.includes('normalized_name') || text.includes('brand_org_normalized')) {
    return 'brand_name_conflict'
  }
  if (text.includes('category_org') || text.includes('sibling_name')) {
    return 'category_name_conflict'
  }
  if (
    text.includes('attribute_definition') ||
    text.includes('attribute_option')
  ) {
    return 'attribute_conflict'
  }
  if (
    text.includes('price_list_org_default') ||
    text.includes('is_default')
  ) {
    return 'default_price_list_exists'
  }
  if (text.includes('price_list_entry_open') || text.includes('valid_to')) {
    return 'price_entry_conflict'
  }
  if (text.includes('combination_hash')) {
    return 'variant_combination_conflict'
  }
  return 'conflict'
}

/**
 * Translate PostgREST / Postgres errors into Catalog application errors.
 * Never propagate raw SQL, table dumps, connection strings, or credentials.
 */
export function mapSupabaseError(error: unknown): never {
  const code = errorCode(error)
  const text = errorText(error)

  if (code === 'PGRST116') {
    throw new CatalogNotFoundError('not_found')
  }
  if (code === '23505') {
    throw new CatalogConflictError(conflictMessage(error))
  }
  if (
    code === '42501' ||
    text.includes('not_authenticated') ||
    text.includes('not_org_member') ||
    text.includes('permission') ||
    text.includes('row-level security')
  ) {
    throw new CatalogPermissionError('permission_denied')
  }
  if (code === '23503') {
    throw new CatalogConflictError('foreign_key_conflict')
  }

  throw new CatalogConflictError('persistence_failed')
}

export function throwIfSupabaseError(error: unknown): void {
  if (error) mapSupabaseError(error)
}
