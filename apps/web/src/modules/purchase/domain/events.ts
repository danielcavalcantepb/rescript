export type PurchaseDomainEvent =
  | {
      type: 'PurchaseCreated'
      organizationId: string
      purchaseOrderId: string
      number: string
      at: string
    }
  | {
      type: 'PurchaseUpdated'
      organizationId: string
      purchaseOrderId: string
      at: string
    }
  | {
      type: 'PurchaseApproved'
      organizationId: string
      purchaseOrderId: string
      at: string
    }
  | {
      type: 'PurchaseCancelled'
      organizationId: string
      purchaseOrderId: string
      at: string
    }
  | {
      type: 'PurchaseArchived'
      organizationId: string
      purchaseOrderId: string
      at: string
    }
  | {
      type: 'PurchaseRestored'
      organizationId: string
      purchaseOrderId: string
      at: string
    }
  | {
      type: 'PurchaseItemAdded'
      organizationId: string
      purchaseOrderId: string
      itemId: string
      at: string
    }
  | {
      type: 'PurchaseItemRemoved'
      organizationId: string
      purchaseOrderId: string
      itemId: string
      at: string
    }

export type PurchaseEventCollector = {
  emit(event: PurchaseDomainEvent): void
  drain(): PurchaseDomainEvent[]
}

export function createInMemoryPurchaseEventCollector(): PurchaseEventCollector {
  const events: PurchaseDomainEvent[] = []
  return {
    emit(event) {
      events.push(event)
    },
    drain() {
      return events.splice(0, events.length)
    },
  }
}
