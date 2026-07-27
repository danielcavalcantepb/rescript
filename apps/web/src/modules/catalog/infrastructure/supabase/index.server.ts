/**
 * Server-only Catalog persistence entrypoint.
 * Import from `#/modules/catalog/infrastructure/supabase/index.server`
 * inside `createServerFn` / loaders — never from React client components.
 */
import '#/modules/catalog/infrastructure/supabase/assert-server-only'

export type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'
export {
  resolveCatalogDatabaseUrlFromEnv,
} from '#/modules/catalog/infrastructure/supabase/client-options'
export {
  createSupabaseCatalogRepos,
  type SupabaseCatalogRepos,
} from '#/modules/catalog/infrastructure/supabase/create-supabase-catalog-repos'
export { mapSupabaseError, throwIfSupabaseError } from '#/modules/catalog/infrastructure/supabase/errors'
export {
  asMoney,
  asQuantity,
  asSku,
  inferTopology,
  mapAttributeDefinition,
  mapBrand,
  mapCategory,
  mapPriceList,
  mapProductAggregate,
  mapVariant,
  sanitizeSearchTerm,
} from '#/modules/catalog/infrastructure/supabase/mappers'
export {
  closeCatalogSqlPools,
  getCatalogSql,
  probeSqlSecurityContext,
  withCatalogTransaction,
} from '#/modules/catalog/infrastructure/supabase/sql.server'
export { SupabaseAttributeRepository } from '#/modules/catalog/infrastructure/supabase/supabase-attribute-repository'
export { SupabaseBrandRepository } from '#/modules/catalog/infrastructure/supabase/supabase-brand-repository'
export { SupabaseCategoryRepository } from '#/modules/catalog/infrastructure/supabase/supabase-category-repository'
export { SupabasePriceListRepository } from '#/modules/catalog/infrastructure/supabase/supabase-price-list-repository'
export { SupabaseProductRepository } from '#/modules/catalog/infrastructure/supabase/supabase-product-repository'
export { SupabaseSearchRepository } from '#/modules/catalog/infrastructure/supabase/supabase-search-repository'
export { SupabaseLifecycleAuditRepository } from '#/modules/catalog/infrastructure/supabase/supabase-lifecycle-audit-repository'
export { SupabaseUnitOfMeasureRepository } from '#/modules/catalog/infrastructure/supabase/supabase-unit-of-measure-repository'
export { SupabaseVariantRepository } from '#/modules/catalog/infrastructure/supabase/supabase-variant-repository'
export {
  assertCatalogTenantAccess,
  assertEntityOrganization,
  assertSafeDatabaseUrl,
  redactSensitive,
} from '#/modules/catalog/infrastructure/supabase/tenant-context'
