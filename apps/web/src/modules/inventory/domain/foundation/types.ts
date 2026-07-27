/** Inventory Foundation domain types — variant × location (no ledger). */

export type OrganizationId = string
export type VariantId = string
export type ProductId = string
export type StockLocationId = string
export type InventoryItemId = string
export type UnitOfMeasureId = string

export type StockLocationStatus = 'active' | 'inactive' | 'archived'
export type InventoryItemStatus = 'active' | 'archived'
export type CatalogLifecycleStatus = 'draft' | 'active' | 'archived'

export type StockLocation = {
  id: StockLocationId
  organizationId: OrganizationId
  code: string
  name: string
  description: string | null
  isDefault: boolean
  /** Higher value preferred when choosing among active locations. */
  priority: number
  status: StockLocationStatus
}

export type InventoryItem = {
  id: InventoryItemId
  organizationId: OrganizationId
  locationId: StockLocationId
  variantId: VariantId
  /** On-hand quantity (foundation snapshot; ledger comes later). */
  quantityOnHand: number
  /** Placeholder until reservations — always 0 in Sprint 023 writes. */
  quantityReserved: number
  status: InventoryItemStatus
}

/** Derived view — never persisted as a separate FT. */
export type InventorySnapshot = {
  itemId: InventoryItemId
  organizationId: OrganizationId
  locationId: StockLocationId
  variantId: VariantId
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  status: InventoryItemStatus
}

export type InventoryContext = {
  locationId?: StockLocationId
  /** When true, require tracksInventory on the operational lookup. */
  requireTracksInventory?: boolean
}

export type InventoryAvailability = {
  variantId: VariantId
  locationId: StockLocationId
  available: boolean
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  reason: string | null
}

/**
 * Operational lookup — essentials only, never a Product aggregate.
 * Owned conceptually by Catalog; consumed by Inventory.
 */
export type InventoryVariantLookup = {
  variantId: VariantId
  productId: ProductId
  organizationId: OrganizationId
  variantStatus: CatalogLifecycleStatus
  productStatus: CatalogLifecycleStatus
  unitOfMeasureId: UnitOfMeasureId | null
  sku: string | null
  tracksInventory: boolean
}

export function quantityAvailable(item: {
  quantityOnHand: number
  quantityReserved: number
}): number {
  return Math.max(0, item.quantityOnHand - item.quantityReserved)
}

export function toInventorySnapshot(item: InventoryItem): InventorySnapshot {
  return {
    itemId: item.id,
    organizationId: item.organizationId,
    locationId: item.locationId,
    variantId: item.variantId,
    quantityOnHand: item.quantityOnHand,
    quantityReserved: item.quantityReserved,
    quantityAvailable: quantityAvailable(item),
    status: item.status,
  }
}
