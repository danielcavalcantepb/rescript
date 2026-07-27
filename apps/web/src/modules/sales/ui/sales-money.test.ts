import { describe, expect, it } from 'vitest'
import { decimalToCents, lineTotalCents } from './sales-money'

describe('sales workspace money', () => {
  it('converts decimal strings without binary-float arithmetic', () => {
    expect(decimalToCents('10.25')).toBe(1025)
    expect(decimalToCents('0,10')).toBe(10)
  })

  it('calculates quantity, discount and total in integer cents', () => {
    expect(lineTotalCents('2', '10.25', '1.00')).toBe(1950)
    expect(lineTotalCents('1.500', '10.00', '0')).toBe(1500)
  })
})
