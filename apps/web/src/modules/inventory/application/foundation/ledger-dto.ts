import type { LedgerMovementType } from '#/modules/inventory/domain/ledger/types'

export type LedgerMovementResponse = {
  id: string
  organizationId: string
  variantId: string
  locationId: string
  inventoryItemId: string
  type: LedgerMovementType
  quantity: number
  signedDelta: number
  beforeQuantity: number
  afterQuantity: number
  reason: string
  notes: string | null
  referenceType: string | null
  referenceId: string | null
  correlationId: string | null
  idempotencyKey: string | null
  reversesMovementId: string | null
  occurredAt: string
  createdAt: string
  createdBy: string
}

export type BalanceProjectionResponse = {
  variantId: string
  locationId: string
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  version: number
}

export type MovementResultResponse = {
  movement: LedgerMovementResponse
  projection: BalanceProjectionResponse
  related: LedgerMovementResponse[]
}

export type CreateEntryCommand = {
  variantId: string
  locationId: string
  quantity: number
  reason: string
  notes?: string | null
  idempotencyKey?: string | null
}

export type CreateExitCommand = CreateEntryCommand

export type CreateAdjustmentCommand = {
  variantId: string
  locationId: string
  /** Positive quantity; direction via direction field. */
  quantity: number
  direction: 'in' | 'out'
  reason: string
  notes?: string | null
  idempotencyKey?: string | null
}

export type CreateTransferCommand = {
  variantId: string
  fromLocationId: string
  toLocationId: string
  quantity: number
  reason: string
  notes?: string | null
  idempotencyKey?: string | null
}

export type ReverseMovementCommand = {
  movementId: string
  reason: string
  notes?: string | null
  idempotencyKey?: string | null
}

export type ListMovementsQuery = {
  variantId?: string
  locationId?: string
  inventoryItemId?: string
  type?: LedgerMovementType | 'all'
  limit?: number
}
