import type {
  AccountsPayable,
  CreatePayableInput,
  ListPayablesQuery,
  ListPayablesResult,
  PayableHistoryEntry,
  PayableInstallment,
  PayableListItem,
  PayableSnapshot,
  SearchPayablesQuery,
  UpdatePayableInput,
} from '#/modules/payable/domain/types'

export type PayableRpcError = {
  code: string
  message: string
  fieldErrors?: Record<string, string>
}

export type PayableRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: PayableRpcError }

export type PayableSummaryDto = PayableListItem
export type PayableDto = AccountsPayable
export type PayableInstallmentDto = PayableInstallment
export type PayableSearchDto = PayableListItem
export type PayableSnapshotDto = PayableSnapshot
export type PayableHistoryDto = PayableHistoryEntry
export type PayableTotalsDto = PayableSnapshot['payable']['totals']

export type {
  CreatePayableInput,
  UpdatePayableInput,
  ListPayablesQuery,
  ListPayablesResult,
  SearchPayablesQuery,
}
