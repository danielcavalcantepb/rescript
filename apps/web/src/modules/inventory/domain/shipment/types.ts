export type InventoryShipmentStatus =
  | 'draft'
  | 'ready'
  | 'dispatched'
  | 'delivered'
  | 'cancelled'

export type InventoryShipmentListQuery = {
  q?: string
  status?: InventoryShipmentStatus | ''
  limit?: number
}

export type InventoryShipmentListItem = {
  id: string
  number: string
  packingId: string
  packingNumber: string
  pickingId: string
  pickingNumber: string
  reservationId: string
  reservationNumber: string
  sourceType: 'sales_order'
  sourceId: string
  sourceNumber: string
  customerName: string
  customerDocument: string | null
  status: InventoryShipmentStatus
  totalQuantityPacked: string
  totalQuantityShipped: string
  carrier: string | null
  service: string | null
  trackingCode: string | null
  dispatchDate: string | null
  deliveredDate: string | null
  createdAt: string
}

export type InventoryShipmentItem = {
  id: string
  packingItemId: string
  pickingItemId: string
  reservationItemId: string
  productId: string
  variantId: string
  productName: string
  description: string | null
  sku: string
  unitCode: string
  locationId: string
  quantityPacked: string
  quantityShipped: string
  status: InventoryShipmentStatus
  ledgerMovementId: string | null
}

export type InventoryShipmentMovement = {
  id: string
  variantId: string
  locationId: string
  inventoryItemId: string
  type: 'exit'
  quantity: string
  signedDelta: string
  beforeQuantity: string
  afterQuantity: string
  reason: string
  occurredAt: string
}

export type InventoryShipmentHistoryEntry = {
  id: string
  action: string
  oldValue: string | null
  newValue: string | null
  reason: string | null
  createdAt: string
}

export type InventoryShipmentDetail = InventoryShipmentListItem & {
  customerId: string | null
  customerEmail: string | null
  customerPhone: string | null
  locationId: string
  freightAmount: string | null
  estimatedDeliveryDate: string | null
  notes: string | null
  updatedAt: string
  items: InventoryShipmentItem[]
  movements: InventoryShipmentMovement[]
  history: InventoryShipmentHistoryEntry[]
}

export type CreateInventoryShipmentInput = {
  packingId: string
  notes?: string | null
}

export type MarkInventoryShipmentReadyInput = {
  shipmentId: string
  carrier?: string | null
  service?: string | null
  trackingCode?: string | null
  freightAmount?: string | null
  estimatedDeliveryDate?: string | null
  notes?: string | null
}

export type DispatchInventoryShipmentInput = {
  shipmentId: string
  idempotencyKey?: string | null
}

export type CompleteInventoryShipmentInput = {
  shipmentId: string
  deliveredDate?: string | null
}

export type CancelInventoryShipmentInput = {
  shipmentId: string
  reason?: string | null
}
