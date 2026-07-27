import { describe, expect, it } from 'vitest'
import { assertAllocationTotal, calculateNetAmount } from './amounts'
import { assertPaymentTransition, isPaymentEditable } from './lifecycle'

describe('payment amounts', () => {
  it('calculates discount, interest, penalty and fee without floating point', () => {
    expect(calculateNetAmount({ grossAmount:'100',discountAmount:'10',interestAmount:'2.5',penaltyAmount:'1',feeAmount:'0.5' })).toBe('94.0000')
  })
  it('rejects non-positive net and allocation mismatch', () => {
    expect(() => calculateNetAmount({ grossAmount:'10',discountAmount:'10',interestAmount:'0',penaltyAmount:'0',feeAmount:'0' })).toThrow('invalid_net_amount')
    expect(() => assertAllocationTotal([{ amount:'9' }], '10')).toThrow('allocation_total_mismatch')
  })
  it('accepts multiple positive allocations matching net', () => {
    expect(() => assertAllocationTotal([{ amount:'4' },{ amount:'6' }], '10')).not.toThrow()
  })
})

describe('payment lifecycle', () => {
  it('enforces immutable confirmed payments', () => {
    expect(isPaymentEditable('confirmed')).toBe(false)
    expect(() => assertPaymentTransition('confirmed','archived')).toThrow('invalid_payment_transition')
    expect(() => assertPaymentTransition('confirmed','reversed')).not.toThrow()
  })
})
