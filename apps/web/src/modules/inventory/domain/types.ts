import type {
  InventoryMovementType,
  ProductStatus,
} from '@rescript/database'

export type { InventoryMovementType }

/** UI stock status — no low_stock (no min field). */
export type StockStatus = 'out_of_stock' | 'available'

/** Application model — product + on-hand qty. Never expose raw DB rows to UI. */
export type ProductStock = {
  productId: string
  organizationId: string
  name: string
  sku: string
  unit: string
  status: ProductStatus
  quantity: number
  stockStatus: StockStatus
  /** Product.updated_at — used for list sort/cursor. */
  updatedAt: string
  /** Balance updated_at when a row exists; otherwise null. */
  balanceUpdatedAt: string | null
}

export type InventoryMovement = {
  id: string
  organizationId: string
  productId: string
  type: InventoryMovementType
  quantity: number
  reason: string
  notes: string | null
  referenceType: string | null
  referenceId: string | null
  occurredAt: string
  createdAt: string
  createdBy: string
}

export type CreateMovementInput = {
  productId: string
  type: InventoryMovementType
  quantity: number
  reason: string
  notes?: string | null
  occurredAt?: string | null
}

export type ListStockQuery = {
  q?: string
  /** Product lifecycle filter. Default: active. */
  status?: ProductStatus | 'all'
  stockStatus?: StockStatus | 'all'
  cursor?: string | null
  limit?: number
  sort?: 'name_asc' | 'updated_desc'
}

export type ListStockResult = {
  items: ProductStock[]
  nextCursor: string | null
}

export type ListMovementsQuery = {
  q?: string
  productId?: string
  type?: InventoryMovementType | 'all'
  from?: string | null
  to?: string | null
  cursor?: string | null
  limit?: number
}

export type ListMovementsResult = {
  items: InventoryMovement[]
  nextCursor: string | null
}

export type InventoryRepository = {
  listStock(
    organizationId: string,
    query: ListStockQuery,
  ): Promise<ListStockResult>
  getProductStock(
    organizationId: string,
    productId: string,
  ): Promise<ProductStock | null>
  listMovements(
    organizationId: string,
    query: ListMovementsQuery,
  ): Promise<ListMovementsResult>
  /** Writes ONLY via RPC register_inventory_movement. */
  registerMovement(
    organizationId: string,
    input: CreateMovementInput,
  ): Promise<InventoryMovement>
}
