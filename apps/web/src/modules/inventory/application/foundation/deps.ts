import type { PermissionKey } from '@rescript/permissions'
import type { InventoryEventCollector } from '#/modules/inventory/domain/foundation/events'
import type { InventoryLedgerPort } from '#/modules/inventory/application/foundation/ledger-ports'
import type {
  ClockPort,
  IdGeneratorPort,
  InventoryHistoryPort,
  InventoryItemRepository,
  InventoryVariantLookupPort,
  StockLocationRepository,
} from '#/modules/inventory/application/foundation/ports'

export type Can = (key: PermissionKey) => boolean

export type InventoryFoundationDeps = {
  organizationId: string
  userId: string
  can: Can
  ids: IdGeneratorPort
  clock: ClockPort
  events: InventoryEventCollector
  locations: StockLocationRepository
  items: InventoryItemRepository
  history: InventoryHistoryPort
  variantLookup: InventoryVariantLookupPort
  ledger: InventoryLedgerPort
}

export function requireInventoryRead(can: Can) {
  return (
    can('inventory.read') ||
    can('inventory.create') ||
    can('inventory.edit') ||
    can('inventory.move') ||
    can('inventory.adjust') ||
    can('inventory.locations.manage')
  )
}

export function requireInventoryCreate(can: Can) {
  return can('inventory.create')
}

export function requireInventoryEdit(can: Can) {
  return can('inventory.edit')
}

export function requireInventoryArchive(can: Can) {
  return can('inventory.archive')
}

export function requireInventoryRestore(can: Can) {
  return can('inventory.restore')
}

export function requireLocationsManage(can: Can) {
  return can('inventory.locations.manage')
}

export function requireLedgerRead(can: Can) {
  return (
    can('inventory.movements.read') ||
    can('inventory.read') ||
    can('inventory.move') ||
    can('inventory.adjust')
  )
}

export function requireLedgerCreate(can: Can) {
  return can('inventory.movements.create') || can('inventory.move')
}

export function requireLedgerAdjust(can: Can) {
  return can('inventory.adjust') || can('inventory.movements.create')
}

export function requireLedgerTransfer(can: Can) {
  return can('inventory.transfer') || can('inventory.movements.create')
}

export function requireLedgerReverse(can: Can) {
  return can('inventory.reverse') || can('inventory.adjust')
}
