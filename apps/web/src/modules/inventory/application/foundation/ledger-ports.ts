import type {
  InventoryLedgerMovement,
  InventoryMovementResult,
  LedgerMovementType,
} from '#/modules/inventory/domain/ledger/types'

export type RegisterLedgerMovementInput = {
  variantId: string
  locationId: string
  type: Exclude<LedgerMovementType, 'reversal'>
  quantity: number
  reason: string
  notes?: string | null
  occurredAt?: string | null
  referenceType?: string | null
  referenceId?: string | null
  correlationId?: string | null
  idempotencyKey?: string | null
}

export type RegisterLedgerTransferInput = {
  variantId: string
  fromLocationId: string
  toLocationId: string
  quantity: number
  reason: string
  notes?: string | null
  occurredAt?: string | null
  idempotencyKey?: string | null
}

export type ReverseLedgerMovementInput = {
  movementId: string
  reason: string
  notes?: string | null
  idempotencyKey?: string | null
}

export type ListLedgerMovementsQuery = {
  variantId?: string
  locationId?: string
  inventoryItemId?: string
  type?: LedgerMovementType | 'all'
  correlationId?: string
  limit?: number
  cursor?: string | null
}

export type ListLedgerMovementsResult = {
  items: InventoryLedgerMovement[]
  nextCursor: string | null
}

/**
 * Port — persistence adapter executes SECURITY DEFINER RPCs.
 * Never used from the browser bundle.
 */
export type InventoryLedgerPort = {
  registerMovement(
    organizationId: string,
    input: RegisterLedgerMovementInput,
  ): Promise<InventoryMovementResult>
  registerTransfer(
    organizationId: string,
    input: RegisterLedgerTransferInput,
  ): Promise<InventoryMovementResult>
  reverseMovement(
    organizationId: string,
    input: ReverseLedgerMovementInput,
  ): Promise<InventoryMovementResult>
  getById(
    organizationId: string,
    movementId: string,
  ): Promise<InventoryLedgerMovement | null>
  list(
    organizationId: string,
    query: ListLedgerMovementsQuery,
  ): Promise<ListLedgerMovementsResult>
}
