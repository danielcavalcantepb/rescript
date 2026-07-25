import type { InventoryMovementType } from '@rescript/database'
import type { StockStatus } from '#/modules/inventory/domain/types'

/**
 * Official signed delta — must match SQL `inventory_movement_delta`.
 * entry / adjustment_in = +qty ; exit / adjustment_out = -qty
 */
export function movementDelta(
  type: InventoryMovementType,
  quantity: number,
): number {
  switch (type) {
    case 'entry':
    case 'adjustment_in':
      return quantity
    case 'exit':
    case 'adjustment_out':
      return -quantity
    default: {
      const _exhaustive: never = type
      return _exhaustive
    }
  }
}

export function applyDelta(balance: number, delta: number): number {
  return balance + delta
}

/** qty <= 0 → out_of_stock; qty > 0 → available. No low_stock. */
export function stockStatus(quantity: number): StockStatus {
  return quantity > 0 ? 'available' : 'out_of_stock'
}
