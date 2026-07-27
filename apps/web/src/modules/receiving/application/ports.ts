import type {
  CreateReceiptInput,
  GoodsReceipt,
  GoodsReceiptItem,
  ListReceiptsQuery,
  ListReceiptsResult,
  PostReceiptInput,
  ReceiptHistoryEntry,
  ReceiptListItem,
  ReceiptStatus,
  ReceiptSupplierSnapshot,
  ReceiptPurchaseSnapshot,
  SearchReceiptsQuery,
  UpdateReceiptItemInput,
} from '#/modules/receiving/domain/types'

export type ReceivingNumberAllocator = {
  allocate(organizationId: string): Promise<string>
}

export type PurchaseReceivingView = {
  purchaseOrderId: string
  purchaseNumber: string
  status: string
  supplier: ReceiptSupplierSnapshot
  items: Array<{
    purchaseItemId: string
    variantId: string
    variantSku: string | null
    variantName: string
    unitCode: string
    orderedQuantity: string
    receivedQuantity: string
    pendingQuantity: string
    status: 'active' | 'removed'
  }>
}

export type PurchaseReceivingPort = {
  /** Returns PO for receiving seed; approved preferred, but closed/others allowed for status reads. */
  getPurchaseForReceiving(
    organizationId: string,
    purchaseOrderId: string,
  ): Promise<PurchaseReceivingView | null>
}

export type GoodsReceiptRepository = {
  getById(organizationId: string, id: string): Promise<GoodsReceipt | null>
  create(
    organizationId: string,
    userId: string,
    input: {
      number: string
      purchase: ReceiptPurchaseSnapshot
      supplier: ReceiptSupplierSnapshot
      locationId: string
      notes: string | null
      status: ReceiptStatus
    },
  ): Promise<GoodsReceipt>
  updateHeader(
    organizationId: string,
    userId: string,
    id: string,
    input: { notes?: string | null; locationId?: string },
  ): Promise<GoodsReceipt>
  setStatus(
    organizationId: string,
    userId: string,
    id: string,
    status: ReceiptStatus,
    archive?: {
      archivedAt: string | null
      archivedBy: string | null
      previousStatus: Exclude<ReceiptStatus, 'archived'> | null
    },
  ): Promise<GoodsReceipt>
}

export type GoodsReceiptItemRepository = {
  listByReceipt(
    organizationId: string,
    goodsReceiptId: string,
  ): Promise<GoodsReceiptItem[]>
  getById(organizationId: string, id: string): Promise<GoodsReceiptItem | null>
  createMany(
    organizationId: string,
    userId: string,
    goodsReceiptId: string,
    items: Array<{
      purchaseItemId: string
      variantId: string
      locationId: string | null
      variantSku: string | null
      variantName: string
      unitCode: string
      orderedQuantity: string
      receivedQuantity: string
      notes: string | null
      divergence: GoodsReceiptItem['divergence']
      sortOrder: number
    }>,
  ): Promise<GoodsReceiptItem[]>
  update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdateReceiptItemInput,
  ): Promise<GoodsReceiptItem>
}

export type GoodsReceiptSearchRepository = {
  list(
    organizationId: string,
    query: ListReceiptsQuery,
  ): Promise<ListReceiptsResult>
  search(
    organizationId: string,
    query: SearchReceiptsQuery,
  ): Promise<ReceiptListItem[]>
}

export type GoodsReceiptHistoryRepository = {
  append(
    organizationId: string,
    entry: {
      goodsReceiptId: string
      action: string
      fieldName?: string | null
      oldValue?: string | null
      newValue?: string | null
      reason?: string | null
      actorUserId: string
      actorIp?: string | null
    },
  ): Promise<ReceiptHistoryEntry>
  listByReceipt(
    organizationId: string,
    goodsReceiptId: string,
    limit?: number,
  ): Promise<ReceiptHistoryEntry[]>
}

/** Atomic post — Ledger ENTRY + PO progress. Idempotent. */
export type GoodsReceiptPostPort = {
  post(
    organizationId: string,
    input: PostReceiptInput,
  ): Promise<GoodsReceipt>
}

export type { CreateReceiptInput }
