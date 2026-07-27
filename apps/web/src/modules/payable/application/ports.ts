import type {
  AccountsPayable,
  CreatePayableInput,
  InstallmentInput,
  ListPayablesQuery,
  ListPayablesResult,
  PayableHistoryEntry,
  PayableInstallment,
  PayableListItem,
  PayablePurchaseSnapshot,
  PayableReceivingSnapshot,
  PayableStatus,
  PayableSupplierSnapshot,
  PayableTotals,
  SearchPayablesQuery,
  UpdatePayableInput,
} from '#/modules/payable/domain/types'

export type PayableNumberAllocator = {
  allocate(organizationId: string): Promise<string>
}

/** Source for creating AP from a posted Goods Receipt. */
export type PayableOriginSource = {
  getPostedReceiptOrigin(
    organizationId: string,
    goodsReceiptId: string,
  ): Promise<{
    supplier: PayableSupplierSnapshot
    purchase: PayablePurchaseSnapshot
    receiving: PayableReceivingSnapshot
    currency: string
    /** Amount derived from received qty × PO line prices. */
    originalAmount: string
  } | null>
}

export type AccountsPayableRepository = {
  getById(organizationId: string, id: string): Promise<AccountsPayable | null>
  create(
    organizationId: string,
    userId: string,
    input: {
      number: string
      supplier: PayableSupplierSnapshot
      purchase: PayablePurchaseSnapshot
      receiving: PayableReceivingSnapshot
      status: PayableStatus
      currency: string
      totals: PayableTotals
      issueDate: string
      notes: string | null
    },
  ): Promise<AccountsPayable>
  updateHeader(
    organizationId: string,
    userId: string,
    id: string,
    input: UpdatePayableInput,
  ): Promise<AccountsPayable>
  setStatus(
    organizationId: string,
    userId: string,
    id: string,
    status: PayableStatus,
    archive?: {
      archivedAt: string | null
      archivedBy: string | null
      previousStatus: Exclude<PayableStatus, 'archived'> | null
    },
  ): Promise<AccountsPayable>
  updateTotals(
    organizationId: string,
    userId: string,
    id: string,
    totals: PayableTotals,
  ): Promise<AccountsPayable>
}

export type PayableInstallmentRepository = {
  listByPayable(
    organizationId: string,
    accountsPayableId: string,
  ): Promise<PayableInstallment[]>
  createMany(
    organizationId: string,
    userId: string,
    accountsPayableId: string,
    installments: InstallmentInput[],
  ): Promise<PayableInstallment[]>
  cancelAll(
    organizationId: string,
    userId: string,
    accountsPayableId: string,
  ): Promise<void>
}

export type PayableSearchRepository = {
  list(
    organizationId: string,
    query: ListPayablesQuery,
  ): Promise<ListPayablesResult>
  search(
    organizationId: string,
    query: SearchPayablesQuery,
  ): Promise<PayableListItem[]>
}

export type PayableHistoryRepository = {
  append(
    organizationId: string,
    entry: {
      accountsPayableId: string
      action: string
      fieldName?: string | null
      oldValue?: string | null
      newValue?: string | null
      reason?: string | null
      actorUserId: string
      actorIp?: string | null
    },
  ): Promise<PayableHistoryEntry>
  listByPayable(
    organizationId: string,
    accountsPayableId: string,
    limit?: number,
  ): Promise<PayableHistoryEntry[]>
}

export type { CreatePayableInput }
