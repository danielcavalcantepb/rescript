import { describe, expect, it } from 'vitest'
import {
  applyDelta,
  movementDelta,
  stockStatus,
} from '#/modules/inventory/domain/balance'

describe('inventory balance (official delta)', () => {
  it('entry and adjustment_in are positive', () => {
    expect(movementDelta('entry', 10)).toBe(10)
    expect(movementDelta('adjustment_in', 3.5)).toBe(3.5)
  })

  it('exit and adjustment_out are negative', () => {
    expect(movementDelta('exit', 4)).toBe(-4)
    expect(movementDelta('adjustment_out', 2)).toBe(-2)
  })

  it('applyDelta updates balance', () => {
    expect(applyDelta(10, movementDelta('entry', 5))).toBe(15)
    expect(applyDelta(10, movementDelta('exit', 3))).toBe(7)
    expect(applyDelta(0, movementDelta('adjustment_out', 1))).toBe(-1)
  })

  it('stockStatus is only out_of_stock or available', () => {
    expect(stockStatus(0)).toBe('out_of_stock')
    expect(stockStatus(-1)).toBe('out_of_stock')
    expect(stockStatus(0.001)).toBe('available')
    expect(stockStatus(12)).toBe('available')
  })
})
