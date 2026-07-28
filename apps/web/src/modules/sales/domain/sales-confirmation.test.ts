import { describe, expect, it } from 'vitest'
import { validateSalesOrderConfirmationInput } from './validation'

describe('sales confirmation contract', () => {
  it('requires branch and payment term before an order can be confirmed', () => {
    expect(() => validateSalesOrderConfirmationInput({ branchId: 'branch', paymentTermId: 'term' })).not.toThrow()
    expect(() => validateSalesOrderConfirmationInput({ paymentTermId: 'term' })).toThrow('sales_order_branch_required')
    expect(() => validateSalesOrderConfirmationInput({ branchId: 'branch' })).toThrow('sales_order_payment_term_required')
  })
})
