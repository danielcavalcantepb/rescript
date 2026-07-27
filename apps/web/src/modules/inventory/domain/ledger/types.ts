export type LedgerMovementType =
  | 'entry'
  | 'exit'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'transfer_out'
  | 'transfer_in'
  | 'reversal'

export const LEDGER_MOVEMENT_TYPES = [
  'entry',
  'exit',
  'adjustment_in',
  'adjustment_out',
  'transfer_out',
  'transfer_in',
  'reversal',
] as const

export type InventoryLedgerMovement = {
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

export type MovementSnapshot = {
  variantId: string
  locationId: string
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number
  version: number
}

export type InventoryMovementResult = {
  movement: InventoryLedgerMovement
  projection: MovementSnapshot
  /** For transfers: both legs. */
  related: InventoryLedgerMovement[]
}

export function ledgerDelta(
  type: LedgerMovementType,
  quantity: number,
): number | null {
  if (!(quantity > 0)) return null
  switch (type) {
    case 'entry':
    case 'adjustment_in':
    case 'transfer_in':
      return quantity
    case 'exit':
    case 'adjustment_out':
    case 'transfer_out':
      return -quantity
    case 'reversal':
      // Signed by caller from original movement
      return null
  }
}
