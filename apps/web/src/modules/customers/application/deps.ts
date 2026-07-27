import type { PermissionKey } from '@rescript/permissions'
import type { CustomerEventCollector } from '#/modules/customers/domain/events'
import type {
  CustomerAddressRepository,
  CustomerContactRepository,
  CustomerHistoryRepository,
  CustomerRepository,
  CustomerSearchRepository,
} from '#/modules/customers/application/ports'

export type CustomerClock = { nowIso: () => string }
export type CustomerIds = { next: () => string }

export type CustomerAppDeps = {
  organizationId: string
  userId: string
  can: (key: PermissionKey) => boolean
  clock: CustomerClock
  ids: CustomerIds
  events: CustomerEventCollector
  customers: CustomerRepository
  search: CustomerSearchRepository
  contacts: CustomerContactRepository
  addresses: CustomerAddressRepository
  history: CustomerHistoryRepository
  actorIp?: string | null
}

export function canReadCustomers(can: CustomerAppDeps['can']): boolean {
  return can('customers.read')
}

export function canCreateCustomers(can: CustomerAppDeps['can']): boolean {
  return can('customers.create') || can('customers.write')
}

export function canEditCustomers(can: CustomerAppDeps['can']): boolean {
  return can('customers.edit') || can('customers.write')
}

export function canArchiveCustomers(can: CustomerAppDeps['can']): boolean {
  return can('customers.archive') || can('customers.write') || can('customers.edit')
}

export function canRestoreCustomers(can: CustomerAppDeps['can']): boolean {
  return can('customers.restore') || can('customers.write') || can('customers.edit')
}

export function canManageContacts(can: CustomerAppDeps['can']): boolean {
  return (
    can('customers.contacts.manage') ||
    can('customers.edit') ||
    can('customers.write')
  )
}

export function canManageAddresses(can: CustomerAppDeps['can']): boolean {
  return (
    can('customers.addresses.manage') ||
    can('customers.edit') ||
    can('customers.write')
  )
}
