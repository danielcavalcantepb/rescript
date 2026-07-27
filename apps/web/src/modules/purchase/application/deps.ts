import type { PermissionKey } from '@rescript/permissions'
import type { PurchaseEventCollector } from '#/modules/purchase/domain/events'
import type {
  PurchaseHistoryRepository,
  PurchaseItemRepository,
  PurchaseNumberAllocator,
  PurchaseRepository,
  PurchaseSearchRepository,
  PurchaseSnapshotSources,
} from '#/modules/purchase/application/ports'

export type PurchaseClock = { nowIso: () => string }
export type PurchaseIds = { next: () => string }

export type PurchaseAppDeps = {
  organizationId: string
  userId: string
  can: (key: PermissionKey) => boolean
  clock: PurchaseClock
  ids: PurchaseIds
  events: PurchaseEventCollector
  numbers: PurchaseNumberAllocator
  snapshots: PurchaseSnapshotSources
  purchases: PurchaseRepository
  items: PurchaseItemRepository
  search: PurchaseSearchRepository
  history: PurchaseHistoryRepository
  actorIp?: string | null
}

export function canReadPurchases(can: PurchaseAppDeps['can']): boolean {
  return can('purchase.read')
}

export function canCreatePurchases(can: PurchaseAppDeps['can']): boolean {
  return can('purchase.create')
}

export function canEditPurchases(can: PurchaseAppDeps['can']): boolean {
  return can('purchase.edit')
}

export function canApprovePurchases(can: PurchaseAppDeps['can']): boolean {
  return can('purchase.approve')
}

export function canCancelPurchases(can: PurchaseAppDeps['can']): boolean {
  return can('purchase.cancel')
}

export function canArchivePurchases(can: PurchaseAppDeps['can']): boolean {
  return can('purchase.archive')
}

export function canRestorePurchases(can: PurchaseAppDeps['can']): boolean {
  return can('purchase.restore')
}

export function canManagePurchaseItems(can: PurchaseAppDeps['can']): boolean {
  return can('purchase.items.manage') || can('purchase.edit')
}
