import type {
  AddPurchaseItemInput,
  CreatePurchaseInput,
  ListPurchasesQuery,
  ListPurchasesResult,
  PurchaseHistoryEntry,
  PurchaseItem,
  PurchaseListItem,
  PurchaseOrder,
  PurchaseSnapshot,
  SearchPurchasesQuery,
  UpdatePurchaseInput,
  UpdatePurchaseItemInput,
} from '#/modules/purchase/domain/types'

export type PurchaseRpcError = {
  code: string
  message: string
  fieldErrors?: Record<string, string>
}

export type PurchaseRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: PurchaseRpcError }

export type PurchaseSummaryDto = PurchaseListItem
export type PurchaseDto = PurchaseOrder
export type PurchaseItemDto = PurchaseItem
export type PurchaseSearchDto = PurchaseListItem
export type PurchaseSnapshotDto = PurchaseSnapshot
export type PurchaseHistoryDto = PurchaseHistoryEntry

export type {
  CreatePurchaseInput,
  UpdatePurchaseInput,
  AddPurchaseItemInput,
  UpdatePurchaseItemInput,
  ListPurchasesQuery,
  ListPurchasesResult,
  SearchPurchasesQuery,
}
