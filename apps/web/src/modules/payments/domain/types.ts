export type PaymentStatus = 'draft' | 'confirmed' | 'reversed' | 'archived'
export type PaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'pix_manual'
  | 'boleto_manual'
  | 'card_manual'
  | 'other'
export type FinancialAccountType = 'bank' | 'cash' | 'other'

export type PaymentAmounts = {
  grossAmount: string
  discountAmount: string
  interestAmount: string
  penaltyAmount: string
  feeAmount: string
  netAmount: string
}

export type PaymentAllocationInput = { installmentId: string; amount: string }
export type CreatePaymentInput = Omit<PaymentAmounts, 'netAmount'> & {
  financialAccountId: string
  method: PaymentMethod
  paidAt: string
  allocations: PaymentAllocationInput[]
  externalReference?: string | null
  notes?: string | null
}

export type FinancialAccount = {
  id: string
  organizationId: string
  name: string
  type: FinancialAccountType
  active: boolean
}

export type PaymentListItem = {
  id: string
  supplierId: string
  supplierLegalName: string
  financialAccountId: string
  financialAccountName: string
  method: PaymentMethod
  status: PaymentStatus
  netAmount: string
  paidAt: string
  externalReference: string | null
}

export type PaymentDetail = PaymentListItem & PaymentAmounts & {
  confirmedAt: string | null
  reversedAt: string | null
  notes: string | null
  reversesPaymentId: string | null
  allocations: Array<{
    id: string
    installmentId: string
    accountsPayableId: string
    installmentSequence: number
    payableNumber: string
    amount: string
  }>
  history: Array<{
    id: string
    action: string
    reason: string | null
    createdAt: string
  }>
}

export type ListPaymentsQuery = {
  q?: string
  supplierId?: string
  financialAccountId?: string
  method?: PaymentMethod
  status?: PaymentStatus
  from?: string
  to?: string
  limit?: number
}
