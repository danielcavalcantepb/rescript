export type PurchaseStatus =
  | 'draft'
  | 'sent'
  | 'confirmed'
  | 'approved'
  | 'cancelled'
  | 'closed'
  | 'archived'

export type PurchasePriceSource = 'price_list' | 'manual'

export type SupplierSnapshot = {
  supplierId: string
  legalName: string
  document: string | null
  email: string | null
  phone: string | null
}

export type VariantSnapshot = {
  variantId: string
  sku: string | null
  name: string
  unitCode: string
  description: string | null
}

export type PriceSnapshot = {
  currency: string
  unitPrice: string
  priceListId: string | null
  source: PurchasePriceSource
}

export type PurchaseTotals = {
  currency: string
  subtotal: string
  discountTotal: string
  grandTotal: string
}

export type PurchaseItem = {
  id: string
  organizationId: string
  purchaseOrderId: string
  variantId: string
  variantSku: string | null
  variantName: string
  unitCode: string
  description: string | null
  quantity: string
  /** Cumulative posted receiving qty (Purchase never moves stock). */
  receivedQuantity: string
  /** Derived: max(0, quantity - receivedQuantity). */
  pendingQuantity: string
  unitPrice: string
  currency: string
  discount: string
  subtotal: string
  total: string
  priceListId: string | null
  priceSource: PurchasePriceSource
  sortOrder: number
  status: 'active' | 'removed'
  removedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PurchaseOrder = {
  id: string
  organizationId: string
  number: string
  supplierId: string
  supplierSnapshot: SupplierSnapshot
  status: PurchaseStatus
  previousStatus: Exclude<PurchaseStatus, 'archived'> | null
  currency: string
  totals: PurchaseTotals
  notes: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PurchaseListItem = {
  id: string
  number: string
  supplierLegalName: string
  supplierDocument: string | null
  status: PurchaseStatus
  currency: string
  grandTotal: string
  createdAt: string
  updatedAt: string
}

export type PurchaseHistoryEntry = {
  id: string
  organizationId: string
  purchaseOrderId: string
  action: string
  fieldName: string | null
  oldValue: string | null
  newValue: string | null
  reason: string | null
  actorUserId: string
  actorIp: string | null
  createdAt: string
}

export type PurchaseSnapshot = {
  order: PurchaseOrder
  items: PurchaseItem[]
}

export type CreatePurchaseInput = {
  supplierId: string
  currency?: string
  notes?: string | null
}

export type UpdatePurchaseInput = {
  notes?: string | null
  currency?: string
}

export type AddPurchaseItemInput = {
  purchaseOrderId: string
  variantId: string
  priceListId: string
  quantity: string
  discount?: string
  description?: string | null
}

export type UpdatePurchaseItemInput = {
  quantity?: string
  unitPrice?: string
  discount?: string
  description?: string | null
}

export type ListPurchasesQuery = {
  q?: string
  status?: PurchaseStatus | 'all'
  from?: string
  to?: string
  cursor?: string | null
  limit?: number
  sort?: 'created_desc' | 'number_asc'
}

export type ListPurchasesResult = {
  items: PurchaseListItem[]
  nextCursor: string | null
}

export type SearchPurchasesQuery = {
  q: string
  status?: PurchaseStatus | 'all'
  limit?: number
}
