export type BranchStatus = 'active' | 'archived'
export type PaymentTermKind = 'single' | 'installment' | 'down_payment' | 'immediate' | 'custom'

export type PaymentTermInstallmentInput = {
  percentage: string
  dueDays: number
}

export type PaymentScheduleInstallment = {
  sequence: number
  percentage: string
  amount: string
  dueDate: string
  isImmediate: boolean
}

export type InventoryPolicy = {
  allowNegativeStock: boolean
  automaticReservation: boolean
  automaticStockDecrease: boolean
  allowConfirmationWithoutStock: boolean
  allowPartialReservation: boolean
}

const decimal = /^\d+(?:\.\d{1,6})?$/

export function validatePaymentTerm(kind: PaymentTermKind, installments: readonly PaymentTermInstallmentInput[]) {
  if (!installments.length) throw new Error('payment_term_requires_installments')
  let total = 0
  for (const installment of installments) {
    if (!decimal.test(installment.percentage) || Number(installment.percentage) <= 0 || installment.dueDays < 0 || !Number.isInteger(installment.dueDays)) {
      throw new Error('invalid_payment_term_installment')
    }
    total += Number(installment.percentage)
  }
  if (Math.abs(total - 100) > 0.000001) throw new Error('payment_term_percentage_mismatch')
  if (kind === 'single' && installments.length !== 1) throw new Error('single_payment_term_requires_one_installment')
  if (kind === 'immediate' && (installments.length !== 1 || installments[0]?.dueDays !== 0)) throw new Error('immediate_payment_term_requires_due_day_zero')
}

export function validateInventoryPolicy(policy: InventoryPolicy) {
  if (policy.allowNegativeStock && !policy.allowConfirmationWithoutStock) {
    throw new Error('negative_stock_requires_confirmation_policy')
  }
}

export function buildPaymentSchedule(total: string, issueDate: string, installments: readonly PaymentTermInstallmentInput[]): PaymentScheduleInstallment[] {
  if (!decimal.test(total) || Number(total) <= 0) throw new Error('invalid_payment_schedule_total')
  const baseDate = new Date(`${issueDate}T00:00:00.000Z`)
  if (Number.isNaN(baseDate.getTime())) throw new Error('invalid_payment_schedule_date')
  return installments.map((installment, index) => {
    const due = new Date(baseDate)
    due.setUTCDate(due.getUTCDate() + installment.dueDays)
    return {
      sequence: index + 1,
      percentage: installment.percentage,
      amount: (Number(total) * Number(installment.percentage) / 100).toFixed(4),
      dueDate: due.toISOString().slice(0, 10),
      isImmediate: installment.dueDays === 0,
    }
  })
}
