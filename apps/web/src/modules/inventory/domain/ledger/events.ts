import type { LedgerMovementType } from '#/modules/inventory/domain/ledger/types'

export type InventoryLedgerEvent =
  | {
      type: 'InventoryMovementCreated'
      organizationId: string
      movementId: string
      movementType: LedgerMovementType
      variantId: string
      locationId: string
    }
  | {
      type: 'InventoryAdjusted'
      organizationId: string
      movementId: string
      variantId: string
      locationId: string
    }
  | {
      type: 'InventoryTransferred'
      organizationId: string
      correlationId: string
      variantId: string
      fromLocationId: string
      toLocationId: string
    }
  | {
      type: 'InventoryReversed'
      organizationId: string
      movementId: string
      reversesMovementId: string
    }
  | {
      type: 'BalanceProjected'
      organizationId: string
      inventoryItemId: string
      afterQuantity: number
    }

export type InventoryLedgerEventCollector = {
  append(events: InventoryLedgerEvent[]): void
  drain(): InventoryLedgerEvent[]
}

export function createInMemoryLedgerEventCollector(): InventoryLedgerEventCollector {
  let buffer: InventoryLedgerEvent[] = []
  return {
    append(events) {
      buffer = buffer.concat(events)
    },
    drain() {
      const out = buffer
      buffer = []
      return out
    },
  }
}
