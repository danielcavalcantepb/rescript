import '#/modules/catalog/infrastructure/supabase/assert-server-only'
import type { CatalogLifecycleAuditPort } from '#/modules/catalog/application/ports/lifecycle-audit'
import type { CatalogPriceHistoryPort } from '#/modules/catalog/application/ports/price-history'
import type {
  AttributeDefinitionRepository,
  BrandRepository,
  CatalogProductRepository,
  CategoryRepository,
  PriceListRepository,
  UnitOfMeasureRepository,
} from '#/modules/catalog/application/ports/repositories'
import type { CatalogSearchPort } from '#/modules/catalog/domain/ports'
import type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'
import {
  assertCatalogTenantAccess,
  assertSafeDatabaseUrl,
} from '#/modules/catalog/infrastructure/supabase/tenant-context'
import { SupabaseAttributeRepository } from '#/modules/catalog/infrastructure/supabase/supabase-attribute-repository'
import { SupabaseBrandRepository } from '#/modules/catalog/infrastructure/supabase/supabase-brand-repository'
import { SupabaseCategoryRepository } from '#/modules/catalog/infrastructure/supabase/supabase-category-repository'
import { SupabasePriceListRepository } from '#/modules/catalog/infrastructure/supabase/supabase-price-list-repository'
import { SupabaseProductRepository } from '#/modules/catalog/infrastructure/supabase/supabase-product-repository'
import { SupabaseSearchRepository } from '#/modules/catalog/infrastructure/supabase/supabase-search-repository'
import { SupabaseLifecycleAuditRepository } from '#/modules/catalog/infrastructure/supabase/supabase-lifecycle-audit-repository'
import { SupabasePriceHistoryRepository } from '#/modules/catalog/infrastructure/supabase/supabase-price-history-repository'
import { SupabaseUnitOfMeasureRepository } from '#/modules/catalog/infrastructure/supabase/supabase-unit-of-measure-repository'
import { SupabaseVariantRepository } from '#/modules/catalog/infrastructure/supabase/supabase-variant-repository'

export type SupabaseCatalogRepos = {
  products: CatalogProductRepository
  variants: SupabaseVariantRepository
  brands: BrandRepository
  categories: CategoryRepository
  priceLists: PriceListRepository
  attributes: AttributeDefinitionRepository
  units: UnitOfMeasureRepository
  lifecycleAudit: CatalogLifecycleAuditPort
  priceHistory: CatalogPriceHistoryPort
  search: CatalogSearchPort
  /** Trusted tenant bound at construction (membership-verified). */
  organizationId: string
  actorUserId: string
}

/**
 * Server-only factory. Verifies JWT + membership before returning adapters.
 * SQL path bypasses RLS — callers must never pass an unverified organizationId.
 */
export async function createSupabaseCatalogRepos(
  options: CatalogSupabaseReposOptions,
): Promise<SupabaseCatalogRepos> {
  assertSafeDatabaseUrl(options.databaseUrl)
  await assertCatalogTenantAccess(options)

  return {
    products: new SupabaseProductRepository(options),
    variants: new SupabaseVariantRepository(options),
    brands: new SupabaseBrandRepository(options),
    categories: new SupabaseCategoryRepository(options),
    priceLists: new SupabasePriceListRepository(options),
    attributes: new SupabaseAttributeRepository(options),
    units: new SupabaseUnitOfMeasureRepository(options),
    lifecycleAudit: new SupabaseLifecycleAuditRepository(options),
    priceHistory: new SupabasePriceHistoryRepository(options),
    search: new SupabaseSearchRepository(options),
    organizationId: options.organizationId,
    actorUserId: options.actorUserId,
  }
}
