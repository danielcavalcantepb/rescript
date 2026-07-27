export type PayableDomainEvent =
  | {
      type: 'PayableCreated'
      organizationId: string
      accountsPayableId: string
      number: string
      at: string
    }
  | {
      type: 'PayableApproved'
      organizationId: string
      accountsPayableId: string
      at: string
    }
  | {
      type: 'PayableCancelled'
      organizationId: string
      accountsPayableId: string
      at: string
    }
  | {
      type: 'PayableArchived'
      organizationId: string
      accountsPayableId: string
      at: string
    }
  | {
      type: 'PayableRestored'
      organizationId: string
      accountsPayableId: string
      at: string
    }
  | {
      type: 'InstallmentCreated'
      organizationId: string
      accountsPayableId: string
      installmentId: string
      at: string
    }

export type PayableEventCollector = {
  emit(event: PayableDomainEvent): void
  drain(): PayableDomainEvent[]
}

export function createInMemoryPayableEventCollector(): PayableEventCollector {
  const events: PayableDomainEvent[] = []
  return {
    emit(event) {
      events.push(event)
    },
    drain() {
      return events.splice(0, events.length)
    },
  }
}
