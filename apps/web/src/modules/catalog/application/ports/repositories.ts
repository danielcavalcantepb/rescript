import type {
  Brand,
  Category,
  PriceList,
  Product,
  AttributeDefinition,
  UnitOfMeasure,
} from '#/modules/catalog/domain/types'

/**
 * Persistence ports for Catalog application layer.
 * No SQL / Supabase knowledge. Phase 3B will provide real adapters.
 */

export type CatalogProductRepository = {
  getById(organizationId: string, productId: string): Promise<Product | null>
  listByOrganization(organizationId: string): Promise<Product[]>
  save(product: Product): Promise<void>
  /** All SKUs in org across products (for uniqueness). */
  listSkus(organizationId: string): Promise<string[]>
  listBarcodes(organizationId: string): Promise<string[]>
}

export type BrandRepository = {
  getById(organizationId: string, brandId: string): Promise<Brand | null>
  listByOrganization(organizationId: string): Promise<Brand[]>
  save(brand: Brand): Promise<void>
  findByNormalizedName(
    organizationId: string,
    normalizedName: string,
  ): Promise<Brand | null>
}

export type CategoryRepository = {
  getById(organizationId: string, categoryId: string): Promise<Category | null>
  listByOrganization(organizationId: string): Promise<Category[]>
  save(category: Category): Promise<void>
}

export type PriceListRepository = {
  getById(organizationId: string, priceListId: string): Promise<PriceList | null>
  getDefault(organizationId: string): Promise<PriceList | null>
  listByOrganization(organizationId: string): Promise<PriceList[]>
  save(priceList: PriceList): Promise<void>
}

export type AttributeDefinitionRepository = {
  getById(
    organizationId: string,
    definitionId: string,
  ): Promise<AttributeDefinition | null>
  findByNormalizedName(
    organizationId: string,
    normalizedName: string,
  ): Promise<AttributeDefinition | null>
  save(definition: AttributeDefinition): Promise<void>
}

/** Platform defaults (org null) + org-scoped UOMs available for product create. */
export type UnitOfMeasureRepository = {
  listAvailable(organizationId: string): Promise<UnitOfMeasure[]>
  getById(
    organizationId: string,
    unitOfMeasureId: string,
  ): Promise<UnitOfMeasure | null>
}

export type IdGeneratorPort = {
  next(): string
}

export type ClockPort = {
  nowIso(): string
}
