/**
 * Client-safe Catalog persistence surface.
 * Concrete SQL repositories live in `index.server.ts` only.
 */
export type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'
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
  numericToDecimalString,
} from '#/modules/catalog/infrastructure/supabase/mappers'
export {
  assertEntityOrganization,
  assertSafeDatabaseUrl,
  redactSensitive,
} from '#/modules/catalog/infrastructure/supabase/tenant-context'
