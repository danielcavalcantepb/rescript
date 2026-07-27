import type { InventoryLedgerEvent } from '#/modules/inventory/domain/ledger/events'

export type InventoryFoundationEvent =
  | {
      type: 'LocationCreated'
      organizationId: string
      locationId: string
    }
  | {
      type: 'LocationArchived'
      organizationId: string
      locationId: string
    }
  | {
      type: 'LocationActivated'
      organizationId: string
      locationId: string
    }
  | {
      type: 'LocationDeactivated'
      organizationId: string
      locationId: string
    }
  | {
      type: 'InventoryItemCreated'
      organizationId: string
      inventoryItemId: string
      variantId: string
      locationId: string
    }
  | {
      type: 'InventoryItemUpdated'
      organizationId: string
      inventoryItemId: string
      variantId: string
      locationId: string
    }
  | {
      type: 'InventoryAvailabilityChecked'
      organizationId: string
      variantId: string
      locationId: string
      available: boolean
    }
  | InventoryLedgerEvent

export type InventoryEventCollector = {
  append(events: InventoryFoundationEvent[]): void
  drain(): InventoryFoundationEvent[]
}

export function createInMemoryInventoryEventCollector(): InventoryEventCollector {
  let buffer: InventoryFoundationEvent[] = []
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
