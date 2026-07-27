export type ReceiptStatus = 'draft' | 'posted' | 'cancelled' | 'archived'

export type ReceiptDivergence = 'short' | 'over' | 'damaged' | 'none'

export type ReceiptPurchaseSnapshot = {
  purchaseOrderId: string
  purchaseNumber: string
}

export type ReceiptSupplierSnapshot = {
  supplierId: string
  legalName: string
  document: string | null
}

export type GoodsReceiptItem = {
  id: string
  organizationId: string
  goodsReceiptId: string
  purchaseItemId: string
  variantId: string
  locationId: string | null
  variantSku: string | null
  variantName: string
  unitCode: string
  orderedQuantity: string
  receivedQuantity: string
  pendingQuantity: string
  divergence: ReceiptDivergence | null
  notes: string | null
  sortOrder: number
  ledgerMovementId: string | null
  createdAt: string
  updatedAt: string
}

export type GoodsReceipt = {
  id: string
  organizationId: string
  number: string
  purchaseOrderId: string
  purchaseSnapshot: ReceiptPurchaseSnapshot
  supplierSnapshot: ReceiptSupplierSnapshot
  status: ReceiptStatus
  previousStatus: Exclude<ReceiptStatus, 'archived'> | null
  locationId: string | null
  notes: string | null
  receivedAt: string | null
  postIdempotencyKey: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ReceiptTotals = {
  lines: number
  orderedQuantity: string
  receivedQuantity: string
  pendingQuantity: string
}

export type ReceiptListItem = {
  id: string
  number: string
  purchaseNumber: string
  supplierLegalName: string
  supplierDocument: string | null
  status: ReceiptStatus
  receivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type ReceiptHistoryEntry = {
  id: string
  organizationId: string
  goodsReceiptId: string
  action: string
  fieldName: string | null
  oldValue: string | null
  newValue: string | null
  reason: string | null
  actorUserId: string
  actorIp: string | null
  createdAt: string
}

export type ReceiptSnapshot = {
  receipt: GoodsReceipt
  items: GoodsReceiptItem[]
  totals: ReceiptTotals
}

export type CreateReceiptInput = {
  purchaseOrderId: string
  locationId: string
  notes?: string | null
  /** When omitted, seed lines with remaining pending qty. */
  items?: Array<{
    purchaseItemId: string
    receivedQuantity: string
    notes?: string | null
    divergence?: ReceiptDivergence | null
  }>
}

export type UpdateReceiptItemInput = {
  receivedQuantity?: string
  notes?: string | null
  divergence?: ReceiptDivergence | null
  locationId?: string | null
}

export type PostReceiptInput = {
  goodsReceiptId: string
  idempotencyKey: string
  allowOverReceive?: boolean
}

export type ListReceiptsQuery = {
  q?: string
  status?: ReceiptStatus | 'all'
  from?: string
  to?: string
  cursor?: string | null
  limit?: number
  sort?: 'created_desc' | 'number_asc'
}

export type ListReceiptsResult = {
  items: ReceiptListItem[]
  nextCursor: string | null
}

export type SearchReceiptsQuery = {
  q: string
  status?: ReceiptStatus | 'all'
  limit?: number
}
