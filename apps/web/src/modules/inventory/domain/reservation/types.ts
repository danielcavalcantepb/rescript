export type InventoryReservationStatus =
  | 'draft'
  | 'active'
  | 'partially_released'
  | 'released'
  | 'cancelled'

export type InventoryReservationListQuery = {
  q?: string
  status?: InventoryReservationStatus | ''
  limit?: number
}

export type InventoryReservationListItem = {
  id: string
  number: string
  sourceType: 'sales_order'
  sourceId: string
  sourceNumber: string
  customerName: string
  customerDocument: string | null
  status: InventoryReservationStatus
  totalQuantityReserved: string
  totalQuantityReleased: string
  createdAt: string
}

export type InventoryReservationItem = {
  id: string
  salesOrderItemId: string | null
  productId: string
  variantId: string
  productName: string
  description: string | null
  sku: string
  unitCode: string
  locationId: string
  quantityReserved: string
  quantityReleased: string
  status: InventoryReservationStatus
}

export type InventoryReservationHistoryEntry = {
  id: string
  action: string
  oldValue: string | null
  newValue: string | null
  reason: string | null
  createdAt: string
}

export type InventoryReservationDetail = InventoryReservationListItem & {
  customerId: string | null
  customerEmail: string | null
  customerPhone: string | null
  locationId: string
  notes: string | null
  updatedAt: string
  items: InventoryReservationItem[]
  history: InventoryReservationHistoryEntry[]
}

export type CreateInventoryReservationInput = {
  salesOrderId: string
  notes?: string | null
}

export type ReleaseInventoryReservationInput = {
  reservationId: string
  items?: Array<{ itemId: string; quantity: string }> | null
  reason?: string | null
}
