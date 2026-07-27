export type PayableStatus =
  | 'draft'
  | 'approved'
  | 'partially_paid'
  | 'paid'
  | 'cancelled'
  | 'archived'

export type InstallmentStatus = 'open' | 'partially_paid' | 'paid' | 'cancelled'

export type PayableSupplierSnapshot = {
  supplierId: string
  legalName: string
  document: string | null
  email: string | null
  phone: string | null
}

export type PayablePurchaseSnapshot = {
  purchaseOrderId: string
  purchaseNumber: string
}

export type PayableReceivingSnapshot = {
  goodsReceiptId: string
  goodsReceiptNumber: string
  receivedAt: string | null
}

export type PayableTotals = {
  currency: string
  originalAmount: string
  openBalance: string
}

export type PayableInstallment = {
  id: string
  organizationId: string
  accountsPayableId: string
  sequence: number
  dueDate: string
  amount: string
  openBalance: string
  status: InstallmentStatus
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type AccountsPayable = {
  id: string
  organizationId: string
  number: string
  supplierSnapshot: PayableSupplierSnapshot
  purchaseSnapshot: PayablePurchaseSnapshot
  receivingSnapshot: PayableReceivingSnapshot
  status: PayableStatus
  previousStatus: Exclude<PayableStatus, 'archived'> | null
  currency: string
  totals: PayableTotals
  issueDate: string
  notes: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PayableListItem = {
  id: string
  number: string
  supplierLegalName: string
  supplierDocument: string | null
  purchaseNumber: string
  goodsReceiptNumber: string
  status: PayableStatus
  currency: string
  originalAmount: string
  openBalance: string
  issueDate: string
  nextDueDate: string | null
  createdAt: string
  updatedAt: string
}

export type PayableHistoryEntry = {
  id: string
  organizationId: string
  accountsPayableId: string
  action: string
  fieldName: string | null
  oldValue: string | null
  newValue: string | null
  reason: string | null
  actorUserId: string
  actorIp: string | null
  createdAt: string
}

export type PayableSnapshot = {
  payable: AccountsPayable
  installments: PayableInstallment[]
}

export type InstallmentInput = {
  dueDate: string
  amount: string
  notes?: string | null
}

export type CreatePayableInput = {
  goodsReceiptId: string
  issueDate?: string
  notes?: string | null
  /** When omitted, single installment due on issue date (or GR received date). */
  installments?: InstallmentInput[]
}

export type UpdatePayableInput = {
  notes?: string | null
  issueDate?: string
}

export type ListPayablesQuery = {
  q?: string
  status?: PayableStatus | 'all'
  dueFrom?: string
  dueTo?: string
  from?: string
  to?: string
  cursor?: string | null
  limit?: number
  sort?: 'created_desc' | 'due_asc' | 'number_asc'
}

export type ListPayablesResult = {
  items: PayableListItem[]
  nextCursor: string | null
}

export type SearchPayablesQuery = {
  q: string
  status?: PayableStatus | 'all'
  limit?: number
}
