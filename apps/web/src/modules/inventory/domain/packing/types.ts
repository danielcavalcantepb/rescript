export type InventoryPackingStatus =
  | 'draft'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type InventoryPackingListQuery = {
  q?: string
  status?: InventoryPackingStatus | ''
  limit?: number
}

export type InventoryPackingListItem = {
  id: string
  number: string
  pickingId: string
  pickingNumber: string
  reservationId: string
  reservationNumber: string
  sourceType: 'sales_order'
  sourceId: string
  sourceNumber: string
  customerName: string
  customerDocument: string | null
  status: InventoryPackingStatus
  totalQuantityPicked: string
  createdAt: string
}

export type InventoryPackingItem = {
  id: string
  pickingItemId: string
  reservationItemId: string
  productId: string
  variantId: string
  productName: string
  description: string | null
  sku: string
  unitCode: string
  locationId: string
  quantityPicked: string
  status: InventoryPackingStatus
}

export type InventoryPackingHistoryEntry = {
  id: string
  action: string
  oldValue: string | null
  newValue: string | null
  reason: string | null
  createdAt: string
}

export type InventoryPackingDetail = InventoryPackingListItem & {
  customerId: string | null
  customerEmail: string | null
  customerPhone: string | null
  locationId: string
  notes: string | null
  updatedAt: string
  items: InventoryPackingItem[]
  history: InventoryPackingHistoryEntry[]
}

export type CreateInventoryPackingInput = {
  pickingId: string
  notes?: string | null
}
