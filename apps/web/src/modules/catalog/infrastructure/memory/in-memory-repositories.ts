import type {
  AttributeDefinitionRepository,
  BrandRepository,
  CatalogProductRepository,
  CategoryRepository,
  PriceListRepository,
  UnitOfMeasureRepository,
} from '#/modules/catalog/application/ports/repositories'
import { InMemoryCatalogStore } from '#/modules/catalog/infrastructure/memory/in-memory-catalog-store'
import type {
  AttributeDefinition,
  Brand,
  Category,
  PriceList,
  Product,
  UnitOfMeasure,
} from '#/modules/catalog/domain/types'

export function createInMemoryProductRepository(
  store: InMemoryCatalogStore,
): CatalogProductRepository {
  return {
    async getById(organizationId, productId) {
      const product = store.products.get(productId)
      if (!product || product.organizationId !== organizationId) return null
      return store.cloneProduct(product)
    },
    async listByOrganization(organizationId) {
      return [...store.products.values()]
        .filter((p) => p.organizationId === organizationId)
        .map((p) => store.cloneProduct(p))
    },
    async save(product: Product) {
      store.products.set(product.id, store.cloneProduct(product))
    },
    async listSkus(organizationId) {
      const skus: string[] = []
      for (const product of store.products.values()) {
        if (product.organizationId !== organizationId) continue
        for (const variant of product.variants) {
          if (variant.sku) skus.push(variant.sku.value)
        }
      }
      return skus
    },
    async listBarcodes(organizationId) {
      const codes: string[] = []
      for (const product of store.products.values()) {
        if (product.organizationId !== organizationId) continue
        for (const variant of product.variants) {
          for (const barcode of variant.barcodes) {
            codes.push(barcode.barcode.value.toUpperCase())
          }
        }
      }
      return codes
    },
  }
}

export function createInMemoryBrandRepository(
  store: InMemoryCatalogStore,
): BrandRepository {
  return {
    async getById(organizationId, brandId) {
      const brand = store.brands.get(brandId)
      if (!brand || brand.organizationId !== organizationId) return null
      return { ...brand }
    },
    async listByOrganization(organizationId) {
      return [...store.brands.values()]
        .filter((b) => b.organizationId === organizationId)
        .map((b) => ({ ...b }))
    },
    async save(brand: Brand) {
      store.brands.set(brand.id, { ...brand })
    },
    async findByNormalizedName(organizationId, normalizedName) {
      for (const brand of store.brands.values()) {
        if (
          brand.organizationId === organizationId &&
          brand.normalizedName === normalizedName
        ) {
          return { ...brand }
        }
      }
      return null
    },
  }
}

export function createInMemoryCategoryRepository(
  store: InMemoryCatalogStore,
): CategoryRepository {
  return {
    async getById(organizationId, categoryId) {
      const category = store.categories.get(categoryId)
      if (!category || category.organizationId !== organizationId) return null
      return { ...category }
    },
    async listByOrganization(organizationId) {
      return [...store.categories.values()]
        .filter((c) => c.organizationId === organizationId)
        .map((c) => ({ ...c }))
    },
    async save(category: Category) {
      store.categories.set(category.id, { ...category })
    },
  }
}

export function createInMemoryPriceListRepository(
  store: InMemoryCatalogStore,
): PriceListRepository {
  return {
    async getById(organizationId, priceListId) {
      const list = store.priceLists.get(priceListId)
      if (!list || list.organizationId !== organizationId) return null
      return structuredClone(list)
    },
    async getDefault(organizationId) {
      for (const list of store.priceLists.values()) {
        if (
          list.organizationId === organizationId &&
          list.isDefault &&
          list.status === 'active'
        ) {
          return structuredClone(list)
        }
      }
      return null
    },
    async listByOrganization(organizationId) {
      return [...store.priceLists.values()]
        .filter((l) => l.organizationId === organizationId)
        .map((l) => structuredClone(l))
    },
    async save(priceList: PriceList) {
      store.priceLists.set(priceList.id, structuredClone(priceList))
    },
  }
}

export function createInMemoryAttributeRepository(
  store: InMemoryCatalogStore,
): AttributeDefinitionRepository {
  return {
    async getById(organizationId, definitionId) {
      const def = store.attributes.get(definitionId)
      if (!def || def.organizationId !== organizationId) return null
      return structuredClone(def)
    },
    async findByNormalizedName(organizationId, normalizedName) {
      for (const def of store.attributes.values()) {
        if (
          def.organizationId === organizationId &&
          def.normalizedName === normalizedName
        ) {
          return structuredClone(def)
        }
      }
      return null
    },
    async save(definition: AttributeDefinition) {
      store.attributes.set(definition.id, structuredClone(definition))
    },
  }
}

export function createInMemoryUnitOfMeasureRepository(
  store: InMemoryCatalogStore,
): UnitOfMeasureRepository {
  return {
    async listAvailable(organizationId: string) {
      return [...store.units.values()].filter(
        (u) =>
          u.organizationId === null || u.organizationId === organizationId,
      )
    },
    async getById(organizationId: string, unitOfMeasureId: string) {
      const unit = store.units.get(unitOfMeasureId) ?? null
      if (!unit) return null
      if (
        unit.organizationId !== null &&
        unit.organizationId !== organizationId
      ) {
        return null
      }
      return structuredClone(unit)
    },
  }
}

export type InMemoryCatalogRepos = {
  store: InMemoryCatalogStore
  products: CatalogProductRepository
  brands: BrandRepository
  categories: CategoryRepository
  priceLists: PriceListRepository
  attributes: AttributeDefinitionRepository
  units: UnitOfMeasureRepository
}

export function createInMemoryCatalogRepos(
  store: InMemoryCatalogStore = new InMemoryCatalogStore(),
): InMemoryCatalogRepos {
  return {
    store,
    products: createInMemoryProductRepository(store),
    brands: createInMemoryBrandRepository(store),
    categories: createInMemoryCategoryRepository(store),
    priceLists: createInMemoryPriceListRepository(store),
    attributes: createInMemoryAttributeRepository(store),
    units: createInMemoryUnitOfMeasureRepository(store),
  }
}

/** Seed platform-like UOMs for in-memory tests (ids stable for fixtures). */
export function seedInMemoryPlatformUnits(store: InMemoryCatalogStore) {
  const defaults: UnitOfMeasure[] = [
    {
      id: 'uom-un',
      organizationId: null,
      code: 'un',
      name: 'Unidade',
      precision: 0,
      integerOnly: true,
    },
    {
      id: 'uom',
      organizationId: null,
      code: 'un',
      name: 'Unidade',
      precision: 0,
      integerOnly: true,
    },
  ]
  for (const unit of defaults) store.units.set(unit.id, unit)
}
