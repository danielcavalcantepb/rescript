import type { PermissionKey } from '@rescript/permissions'
import type { ReceivingEventCollector } from '#/modules/receiving/domain/events'
import type {
  GoodsReceiptHistoryRepository,
  GoodsReceiptItemRepository,
  GoodsReceiptPostPort,
  GoodsReceiptRepository,
  GoodsReceiptSearchRepository,
  PurchaseReceivingPort,
  ReceivingNumberAllocator,
} from '#/modules/receiving/application/ports'

export type ReceivingClock = { nowIso: () => string }
export type ReceivingIds = { next: () => string }

export type ReceivingAppDeps = {
  organizationId: string
  userId: string
  can: (key: PermissionKey) => boolean
  clock: ReceivingClock
  ids: ReceivingIds
  events: ReceivingEventCollector
  numbers: ReceivingNumberAllocator
  purchases: PurchaseReceivingPort
  receipts: GoodsReceiptRepository
  items: GoodsReceiptItemRepository
  search: GoodsReceiptSearchRepository
  history: GoodsReceiptHistoryRepository
  poster: GoodsReceiptPostPort
  actorIp?: string | null
}

export function canReadReceiving(can: ReceivingAppDeps['can']): boolean {
  return can('goods.receiving.read') || can('receiving.read')
}

export function canCreateReceiving(can: ReceivingAppDeps['can']): boolean {
  return can('goods.receiving.create') || can('receiving.create')
}

export function canPostReceiving(can: ReceivingAppDeps['can']): boolean {
  return (
    can('goods.receiving.complete') ||
    can('receiving.post') ||
    can('receiving.receive')
  )
}

export function canReceiveItems(can: ReceivingAppDeps['can']): boolean {
  return (
    can('goods.receiving.start') ||
    can('goods.receiving.create') ||
    can('receiving.receive') ||
    can('receiving.create') ||
    can('receiving.post')
  )
}

export function canCancelReceiving(can: ReceivingAppDeps['can']): boolean {
  return can('goods.receiving.cancel') || can('receiving.cancel')
}

export function canArchiveReceiving(can: ReceivingAppDeps['can']): boolean {
  return can('receiving.archive')
}

export function canRestoreReceiving(can: ReceivingAppDeps['can']): boolean {
  return can('receiving.restore')
}
