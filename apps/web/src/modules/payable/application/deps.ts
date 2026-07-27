import type { PermissionKey } from '@rescript/permissions'
import type { PayableEventCollector } from '#/modules/payable/domain/events'
import type {
  AccountsPayableRepository,
  PayableHistoryRepository,
  PayableInstallmentRepository,
  PayableNumberAllocator,
  PayableOriginSource,
  PayableSearchRepository,
} from '#/modules/payable/application/ports'

export type PayableClock = { nowIso: () => string }
export type PayableIds = { next: () => string }

export type PayableAppDeps = {
  organizationId: string
  userId: string
  can: (key: PermissionKey) => boolean
  clock: PayableClock
  ids: PayableIds
  events: PayableEventCollector
  numbers: PayableNumberAllocator
  origins: PayableOriginSource
  payables: AccountsPayableRepository
  installments: PayableInstallmentRepository
  search: PayableSearchRepository
  history: PayableHistoryRepository
  actorIp?: string | null
}

export function canReadPayables(can: PayableAppDeps['can']): boolean {
  return can('payable.read')
}

export function canCreatePayables(can: PayableAppDeps['can']): boolean {
  return can('payable.create')
}

export function canEditPayables(can: PayableAppDeps['can']): boolean {
  return can('payable.edit')
}

export function canApprovePayables(can: PayableAppDeps['can']): boolean {
  return can('payable.approve')
}

export function canCancelPayables(can: PayableAppDeps['can']): boolean {
  return can('payable.cancel')
}

export function canArchivePayables(can: PayableAppDeps['can']): boolean {
  return can('payable.archive')
}

export function canRestorePayables(can: PayableAppDeps['can']): boolean {
  return can('payable.restore')
}
