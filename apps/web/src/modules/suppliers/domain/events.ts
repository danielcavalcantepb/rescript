export type SupplierDomainEvent =
  | {
      type: 'SupplierCreated'
      organizationId: string
      supplierId: string
      personType: 'PF' | 'PJ'
      at: string
    }
  | {
      type: 'SupplierUpdated'
      organizationId: string
      supplierId: string
      at: string
    }
  | {
      type: 'SupplierActivated'
      organizationId: string
      supplierId: string
      at: string
    }
  | {
      type: 'SupplierDeactivated'
      organizationId: string
      supplierId: string
      at: string
    }
  | {
      type: 'SupplierArchived'
      organizationId: string
      supplierId: string
      at: string
    }
  | {
      type: 'SupplierRestored'
      organizationId: string
      supplierId: string
      at: string
    }
  | {
      type: 'SupplierContactAdded'
      organizationId: string
      supplierId: string
      contactId: string
      at: string
    }
  | {
      type: 'SupplierAddressAdded'
      organizationId: string
      supplierId: string
      addressId: string
      at: string
    }

export type SupplierEventCollector = {
  emit(event: SupplierDomainEvent): void
  drain(): SupplierDomainEvent[]
}

export function createInMemorySupplierEventCollector(): SupplierEventCollector {
  const events: SupplierDomainEvent[] = []
  return {
    emit(event) {
      events.push(event)
    },
    drain() {
      return events.splice(0, events.length)
    },
  }
}
