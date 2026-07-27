import type {
  InventoryItemRepository,
  InventoryVariantLookupPort,
  StockLocationRepository,
} from '#/modules/inventory/application/foundation/ports'
import type {
  InventoryItem,
  InventoryVariantLookup,
  StockLocation,
} from '#/modules/inventory/domain/foundation/types'

export function createInMemoryStockLocationRepository(
  seed: StockLocation[] = [],
): StockLocationRepository {
  const map = new Map(seed.map((l) => [l.id, structuredClone(l)]))
  return {
    async getById(_organizationId, locationId) {
      return map.get(locationId) ? structuredClone(map.get(locationId)!) : null
    },
    async getDefault(organizationId) {
      for (const loc of map.values()) {
        if (
          loc.organizationId === organizationId &&
          loc.isDefault &&
          loc.status !== 'archived'
        ) {
          return structuredClone(loc)
        }
      }
      return null
    },
    async listByOrganization(organizationId) {
      return [...map.values()]
        .filter((l) => l.organizationId === organizationId)
        .map((l) => structuredClone(l))
    },
    async save(location) {
      const next = structuredClone(location)
      if (next.isDefault && next.status !== 'archived') {
        for (const [id, loc] of map) {
          if (
            loc.organizationId === next.organizationId &&
            loc.isDefault &&
            id !== next.id
          ) {
            map.set(id, { ...loc, isDefault: false })
          }
        }
      }
      map.set(next.id, next)
    },
  }
}

export function createInMemoryInventoryItemRepository(
  seed: InventoryItem[] = [],
): InventoryItemRepository {
  const map = new Map(seed.map((i) => [i.id, structuredClone(i)]))
  return {
    async getById(_organizationId, inventoryItemId) {
      return map.get(inventoryItemId)
        ? structuredClone(map.get(inventoryItemId)!)
        : null
    },
    async getByVariantAndLocation(organizationId, variantId, locationId) {
      for (const item of map.values()) {
        if (
          item.organizationId === organizationId &&
          item.variantId === variantId &&
          item.locationId === locationId
        ) {
          return structuredClone(item)
        }
      }
      return null
    },
    async listByOrganization(organizationId, query) {
      return [...map.values()]
        .filter((i) => i.organizationId === organizationId)
        .filter((i) =>
          query?.variantId ? i.variantId === query.variantId : true,
        )
        .filter((i) =>
          query?.locationId ? i.locationId === query.locationId : true,
        )
        .filter((i) => (query?.status ? i.status === query.status : true))
        .map((i) => structuredClone(i))
    },
    async save(item) {
      map.set(item.id, structuredClone(item))
    },
  }
}

export function createInMemoryVariantLookup(
  seed: InventoryVariantLookup[] = [],
): InventoryVariantLookupPort {
  const map = new Map(seed.map((v) => [v.variantId, structuredClone(v)]))
  return {
    async lookupVariant(variantId) {
      return map.get(variantId) ? structuredClone(map.get(variantId)!) : null
    },
    async lookupVariants(variantIds) {
      return variantIds
        .map((id) => map.get(id))
        .filter((v): v is InventoryVariantLookup => Boolean(v))
        .map((v) => structuredClone(v))
    },
  }
}
