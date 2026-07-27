export type StockLocationResponse = {
  id: string
  organizationId: string
  code: string
  name: string
  description: string | null
  isDefault: boolean
  priority: number
  status: 'active' | 'inactive' | 'archived'
}

export type InventoryItemResponse = {
  id: string
  organizationId: string
  locationId: string
  variantId: string
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  status: 'active' | 'archived'
}

export type InventoryAvailabilityResponse = {
  variantId: string
  locationId: string
  available: boolean
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  reason: string | null
}

export type InventoryVariantLookupResponse = {
  variantId: string
  productId: string
  organizationId: string
  variantStatus: 'draft' | 'active' | 'archived'
  productStatus: 'draft' | 'active' | 'archived'
  unitOfMeasureId: string | null
  sku: string | null
  tracksInventory: boolean
}

export type VariantInventorySummaryResponse = {
  variantId: string
  productId: string
  defaultLocation: StockLocationResponse | null
  item: InventoryItemResponse | null
  availability: InventoryAvailabilityResponse | null
}

export type CreateLocationCommand = {
  code: string
  name: string
  description?: string | null
  isDefault?: boolean
  priority?: number
}

export type UpdateLocationCommand = {
  locationId: string
  code?: string
  name?: string
  description?: string | null
  isDefault?: boolean
  priority?: number
}

export type LocationIdCommand = {
  locationId: string
}

export type CreateInventoryItemCommand = {
  variantId: string
  locationId: string
  quantityOnHand?: number
  reason?: string | null
}

export type UpdateInventoryItemCommand = {
  inventoryItemId: string
  quantityOnHand?: number
  reason?: string | null
}

export type GetAvailabilityQuery = {
  variantId: string
  locationId?: string
}
