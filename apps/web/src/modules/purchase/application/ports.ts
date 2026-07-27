import type {
  AddPurchaseItemInput,
  CreatePurchaseInput,
  ListPurchasesQuery,
  ListPurchasesResult,
  PriceSnapshot,
  PurchaseHistoryEntry,
  PurchaseItem,
  PurchaseOrder,
  PurchaseSnapshot,
  PurchaseStatus,
  PurchaseTotals,
  SearchPurchasesQuery,
  SupplierSnapshot,
  UpdatePurchaseInput,
  UpdatePurchaseItemInput,
  VariantSnapshot,
  PurchaseListItem,
} from '#/modules/purchase/domain/types'

export type PurchaseNumberAllocator = {
  allocate(organizationId: string): Promise<string>
}

export type PurchaseSnapshotSources = {
  getSupplierSnapshot(
    organizationId: string,
    supplierId: string,
  ): Promise<SupplierSnapshot | null>
  getVariantSnapshot(
    organizationId: string,
    variantId: string,
  ): Promise<VariantSnapshot | null>
  resolvePriceSnapshot(
    organizationId: string,
    variantId: string,
    priceListId: string,
  ): Promise<PriceSnapshot | null>
}

export type PurchaseRepository = {
  getById(organizationId: string, id: string): Promise<PurchaseOrder | null>
  create(
    organizationId: string,
    userId: string,
    input: {
      number: string
      supplierId: string
      supplierSnapshot: SupplierSnapshot
      status: PurchaseStatus
      currency: string
      totals: PurchaseTotals
      notes: string | null
    },
  ): Promise<PurchaseOrder>
  updateHeader(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdatePurchaseInput & { totals?: PurchaseTotals },
  ): Promise<PurchaseOrder>
  setStatus(
    organizationId: string,
    userId: string,
    id: string,
    status: PurchaseStatus,
    archive?: {
      archivedAt: string | null
      archivedBy: string | null
      previousStatus: Exclude<PurchaseStatus, 'archived'> | null
    },
  ): Promise<PurchaseOrder>
  updateTotals(
    organizationId: string,
    userId: string,
    id: string,
    totals: PurchaseTotals,
  ): Promise<PurchaseOrder>
}

export type PurchaseItemRepository = {
  listByPurchase(
    organizationId: string,
    purchaseOrderId: string,
    includeRemoved?: boolean,
  ): Promise<PurchaseItem[]>
  getById(organizationId: string, id: string): Promise<PurchaseItem | null>
  create(
    organizationId: string,
    userId: string,
    input: {
      purchaseOrderId: string
      variantId: string
      variantSnapshot: VariantSnapshot
      priceSnapshot: PriceSnapshot
      description: string | null
      quantity: string
      discount: string
      subtotal: string
      total: string
      sortOrder: number
    },
  ): Promise<PurchaseItem>
  update(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdatePurchaseItemInput & {
      subtotal?: string
      total?: string
      unitPrice?: string
      currency?: string
    },
  ): Promise<PurchaseItem>
  softRemove(
    organizationId: string,
    userId: string,
    id: string,
  ): Promise<PurchaseItem>
}

export type PurchaseSearchRepository = {
  list(
    organizationId: string,
    query: ListPurchasesQuery,
  ): Promise<ListPurchasesResult>
  search(
    organizationId: string,
    query: SearchPurchasesQuery,
  ): Promise<PurchaseListItem[]>
}

export type PurchaseHistoryRepository = {
  append(
    organizationId: string,
    entry: {
      purchaseOrderId: string
      action: string
      fieldName?: string | null
      oldValue?: string | null
      newValue?: string | null
      reason?: string | null
      actorUserId: string
      actorIp?: string | null
    },
  ): Promise<PurchaseHistoryEntry>
  listByPurchase(
    organizationId: string,
    purchaseOrderId: string,
    limit?: number,
  ): Promise<PurchaseHistoryEntry[]>
}

export type {
  CreatePurchaseInput,
  AddPurchaseItemInput,
  PurchaseSnapshot,
}
