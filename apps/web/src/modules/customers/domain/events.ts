export type CustomerDomainEvent =
  | {
      type: 'CustomerCreated'
      organizationId: string
      customerId: string
      personType: 'PF' | 'PJ'
      at: string
    }
  | {
      type: 'CustomerUpdated'
      organizationId: string
      customerId: string
      at: string
    }
  | {
      type: 'CustomerActivated'
      organizationId: string
      customerId: string
      at: string
    }
  | {
      type: 'CustomerDeactivated'
      organizationId: string
      customerId: string
      at: string
    }
  | {
      type: 'CustomerArchived'
      organizationId: string
      customerId: string
      at: string
    }
  | {
      type: 'CustomerRestored'
      organizationId: string
      customerId: string
      at: string
    }
  | {
      type: 'ContactAdded'
      organizationId: string
      customerId: string
      contactId: string
      at: string
    }
  | {
      type: 'AddressAdded'
      organizationId: string
      customerId: string
      addressId: string
      at: string
    }

export type CustomerEventCollector = {
  emit(event: CustomerDomainEvent): void
  drain(): CustomerDomainEvent[]
}

export function createInMemoryCustomerEventCollector(): CustomerEventCollector {
  const events: CustomerDomainEvent[] = []
  return {
    emit(event) {
      events.push(event)
    },
    drain() {
      return events.splice(0, events.length)
    },
  }
}
