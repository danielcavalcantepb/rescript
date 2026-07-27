export type ReceivingDomainEvent =
  | {
      type: 'GoodsReceiptCreated'
      organizationId: string
      goodsReceiptId: string
      number: string
      at: string
    }
  | {
      type: 'GoodsReceiptPosted'
      organizationId: string
      goodsReceiptId: string
      at: string
    }
  | {
      type: 'GoodsReceiptCancelled'
      organizationId: string
      goodsReceiptId: string
      at: string
    }
  | {
      type: 'GoodsReceiptArchived'
      organizationId: string
      goodsReceiptId: string
      at: string
    }
  | {
      type: 'GoodsReceiptRestored'
      organizationId: string
      goodsReceiptId: string
      at: string
    }
  | {
      type: 'InventoryEntryCreated'
      organizationId: string
      goodsReceiptId: string
      itemId: string
      at: string
    }
  | {
      type: 'PurchaseCompleted'
      organizationId: string
      purchaseOrderId: string
      goodsReceiptId: string
      at: string
    }
  | {
      type: 'PartialReceivingCompleted'
      organizationId: string
      purchaseOrderId: string
      goodsReceiptId: string
      at: string
    }

export type ReceivingEventCollector = {
  emit(event: ReceivingDomainEvent): void
  drain(): ReceivingDomainEvent[]
}

export function createInMemoryReceivingEventCollector(): ReceivingEventCollector {
  const events: ReceivingDomainEvent[] = []
  return {
    emit(event) {
      events.push(event)
    },
    drain() {
      return events.splice(0, events.length)
    },
  }
}
