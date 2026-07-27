import type {
  BalanceProjectionResponse,
  LedgerMovementResponse,
  MovementResultResponse,
} from '#/modules/inventory/application/foundation/ledger-dto'
import type {
  InventoryLedgerMovement,
  InventoryMovementResult,
  MovementSnapshot,
} from '#/modules/inventory/domain/ledger/types'

export function toLedgerMovementResponse(
  movement: InventoryLedgerMovement,
): LedgerMovementResponse {
  return { ...movement }
}

export function toBalanceProjectionResponse(
  projection: MovementSnapshot,
): BalanceProjectionResponse {
  return { ...projection }
}

export function toMovementResultResponse(
  result: InventoryMovementResult,
): MovementResultResponse {
  return {
    movement: toLedgerMovementResponse(result.movement),
    projection: toBalanceProjectionResponse(result.projection),
    related: result.related.map(toLedgerMovementResponse),
  }
}
