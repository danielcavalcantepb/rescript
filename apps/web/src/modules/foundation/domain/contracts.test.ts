import { describe, expect, it } from 'vitest'
import { buildPaymentSchedule, validateInventoryPolicy, validatePaymentTerm } from './contracts'

describe('fundamental domain contracts', () => {
  it('models immediate, installment and down-payment terms without moving cash', () => {
    expect(() => validatePaymentTerm('immediate', [{ percentage: '100', dueDays: 0 }])).not.toThrow()
    expect(() => validatePaymentTerm('installment', [{ percentage: '50', dueDays: 30 }, { percentage: '50', dueDays: 60 }])).not.toThrow()
    expect(() => validatePaymentTerm('down_payment', [{ percentage: '30', dueDays: 0 }, { percentage: '70', dueDays: 30 }])).not.toThrow()
  })

  it('rejects invalid schedules and conflicting inventory policy', () => {
    expect(() => validatePaymentTerm('single', [{ percentage: '50', dueDays: 0 }, { percentage: '50', dueDays: 30 }])).toThrow('single_payment_term_requires_one_installment')
    expect(() => validatePaymentTerm('immediate', [{ percentage: '100', dueDays: 1 }])).toThrow('immediate_payment_term_requires_due_day_zero')
    expect(() => validateInventoryPolicy({ allowNegativeStock: true, automaticReservation: true, automaticStockDecrease: false, allowConfirmationWithoutStock: false, allowPartialReservation: false })).toThrow('negative_stock_requires_confirmation_policy')
  })

  it('creates deterministic due dates from a term contract', () => {
    expect(buildPaymentSchedule('100.00', '2026-07-28', [{ percentage: '30', dueDays: 0 }, { percentage: '70', dueDays: 30 }])).toEqual([
      { sequence: 1, percentage: '30', amount: '30.0000', dueDate: '2026-07-28', isImmediate: true },
      { sequence: 2, percentage: '70', amount: '70.0000', dueDate: '2026-08-27', isImmediate: false },
    ])
  })
})
