/**
 * Catalog bounded context.
 * Phase 1: domain
 * Phase 3A: application (ports + in-memory)
 * Phase 3B: Supabase persistence adapters (server-only entry)
 *
 * Concrete SQL repositories are NOT exported here.
 * Server code must import:
 *   `#/modules/catalog/infrastructure/supabase/index.server`
 */
export * from '#/modules/catalog/domain'
export * from '#/modules/catalog/application'
export {
  InMemoryCatalogStore,
  createSequentialIdGenerator,
  createFixedClock,
} from '#/modules/catalog/infrastructure/memory/in-memory-catalog-store'
export {
  createInMemoryCatalogRepos,
  createInMemoryProductRepository,
  createInMemoryBrandRepository,
  createInMemoryCategoryRepository,
  createInMemoryPriceListRepository,
  createInMemoryAttributeRepository,
} from '#/modules/catalog/infrastructure/memory/in-memory-repositories'
export {
  mapSupabaseError,
  redactSensitive,
  type CatalogSupabaseReposOptions,
} from '#/modules/catalog/infrastructure/supabase'
