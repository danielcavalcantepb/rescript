import type {
  AttributeDefinition,
  Brand,
  Category,
  PriceList,
  Product,
  UnitOfMeasure,
} from '#/modules/catalog/domain/types'

/** Shared in-memory store for Catalog application tests (Phase 3A only). */
export class InMemoryCatalogStore {
  readonly products = new Map<string, Product>()
  readonly brands = new Map<string, Brand>()
  readonly categories = new Map<string, Category>()
  readonly priceLists = new Map<string, PriceList>()
  readonly attributes = new Map<string, AttributeDefinition>()
  readonly units = new Map<string, UnitOfMeasure>()

  clear() {
    this.products.clear()
    this.brands.clear()
    this.categories.clear()
    this.priceLists.clear()
    this.attributes.clear()
    this.units.clear()
  }

  cloneProduct(product: Product): Product {
    return structuredClone(product)
  }
}

export function createSequentialIdGenerator(prefix = 'id') {
  let n = 0
  return {
    next() {
      n += 1
      return `${prefix}-${n}`
    },
  }
}

export function createFixedClock(iso = '2026-07-25T12:00:00.000Z') {
  return {
    nowIso() {
      return iso
    },
  }
}
