import type {
  CreateReceiptInput,
  ListReceiptsQuery,
  ListReceiptsResult,
  PostReceiptInput,
  ReceiptHistoryEntry,
  ReceiptListItem,
  ReceiptSnapshot,
  SearchReceiptsQuery,
  UpdateReceiptItemInput,
  GoodsReceipt,
  GoodsReceiptItem,
} from '#/modules/receiving/domain/types'

export type ReceivingRpcError = {
  code: string
  message: string
  fieldErrors?: Record<string, string>
}

export type ReceivingRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ReceivingRpcError }

export type ReceiptSummaryDto = ReceiptListItem
export type ReceiptDto = GoodsReceipt
export type ReceiptItemDto = GoodsReceiptItem
export type ReceiptSearchDto = ReceiptListItem
export type ReceiptSnapshotDto = ReceiptSnapshot
export type ReceiptHistoryDto = ReceiptHistoryEntry

export type {
  CreateReceiptInput,
  UpdateReceiptItemInput,
  PostReceiptInput,
  ListReceiptsQuery,
  ListReceiptsResult,
  SearchReceiptsQuery,
}
