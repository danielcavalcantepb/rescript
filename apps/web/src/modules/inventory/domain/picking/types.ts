export type InventoryPickingStatus =
  | 'draft'
  | 'in_progress'
  | 'partially_picked'
  | 'completed'
  | 'cancelled'

export type InventoryPickingListQuery = {
  q?: string
  status?: InventoryPickingStatus | ''
  limit?: number
}

export type InventoryPickingListItem = {
  id: string
  number: string
  reservationId: string
  reservationNumber: string
  sourceType: 'sales_order'
  sourceId: string
  sourceNumber: string
  customerName: string
  customerDocument: string | null
  status: InventoryPickingStatus
  totalQuantityReserved: string
  totalQuantityPicked: string
  createdAt: string
}

export type InventoryPickingItem = {
  id: string
  reservationItemId: string
  productId: string
  variantId: string
  productName: string
  description: string | null
  sku: string
  unitCode: string
  locationId: string
  quantityReserved: string
  quantityPicked: string
  status: InventoryPickingStatus
}

export type InventoryPickingHistoryEntry = {
  id: string
  action: string
  oldValue: string | null
  newValue: string | null
  reason: string | null
  createdAt: string
}

export type InventoryPickingDetail = InventoryPickingListItem & {
  customerId: string | null
  customerEmail: string | null
  customerPhone: string | null
  locationId: string
  notes: string | null
  updatedAt: string
  items: InventoryPickingItem[]
  history: InventoryPickingHistoryEntry[]
}

export type CreateInventoryPickingInput = {
  reservationId: string
  notes?: string | null
}

export type UpdateInventoryPickingItemsInput = {
  pickingId: string
  items: Array<{ itemId: string; quantity: string }>
  reason?: string | null
}
