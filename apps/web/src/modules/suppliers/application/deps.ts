import type { PermissionKey } from '@rescript/permissions'
import type { SupplierEventCollector } from '#/modules/suppliers/domain/events'
import type {
  SupplierAddressRepository,
  SupplierContactRepository,
  SupplierHistoryRepository,
  SupplierRepository,
  SupplierSearchRepository,
} from '#/modules/suppliers/application/ports'

export type SupplierClock = { nowIso: () => string }
export type SupplierIds = { next: () => string }

export type SupplierAppDeps = {
  organizationId: string
  userId: string
  can: (key: PermissionKey) => boolean
  clock: SupplierClock
  ids: SupplierIds
  events: SupplierEventCollector
  suppliers: SupplierRepository
  search: SupplierSearchRepository
  contacts: SupplierContactRepository
  addresses: SupplierAddressRepository
  history: SupplierHistoryRepository
  actorIp?: string | null
}

export function canReadSuppliers(can: SupplierAppDeps['can']): boolean {
  return can('suppliers.read')
}

export function canCreateSuppliers(can: SupplierAppDeps['can']): boolean {
  return can('suppliers.create') || can('suppliers.write')
}

export function canEditSuppliers(can: SupplierAppDeps['can']): boolean {
  return can('suppliers.edit') || can('suppliers.write')
}

export function canArchiveSuppliers(can: SupplierAppDeps['can']): boolean {
  return can('suppliers.archive') || can('suppliers.write') || can('suppliers.edit')
}

export function canRestoreSuppliers(can: SupplierAppDeps['can']): boolean {
  return can('suppliers.restore') || can('suppliers.write') || can('suppliers.edit')
}

export function canManageContacts(can: SupplierAppDeps['can']): boolean {
  return (
    can('suppliers.contacts.manage') ||
    can('suppliers.edit') ||
    can('suppliers.write')
  )
}

export function canManageAddresses(can: SupplierAppDeps['can']): boolean {
  return (
    can('suppliers.addresses.manage') ||
    can('suppliers.edit') ||
    can('suppliers.write')
  )
}
