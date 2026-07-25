import { describe, expect, it } from 'vitest'
import { applyDelta, movementDelta } from '#/modules/inventory/domain/balance'

/**
 * Models the RPC guard: serialize ops on one product; reject when result < 0.
 * Live DB concurrency is covered by InventoryRLSSmoke checklist.
 */
describe('inventory concurrency model', () => {
  it('serial ops keep non-negative balance', () => {
    let qty = 0
    qty = applyDelta(qty, movementDelta('entry', 10))
    qty = applyDelta(qty, movementDelta('exit', 3))
    qty = applyDelta(qty, movementDelta('adjustment_out', 2))
    expect(qty).toBe(5)
  })

  it('rejects second exit when only one unit remains', () => {
    let qty = 1
    const first = movementDelta('exit', 1)
    const next = qty + first
    expect(next).toBe(0)
    qty = next

    const second = movementDelta('exit', 1)
    expect(qty + second).toBeLessThan(0)
  })

  it('entry and exit deltas are opposites', () => {
    expect(movementDelta('entry', 4)).toBe(4)
    expect(movementDelta('exit', 4)).toBe(-4)
    expect(movementDelta('adjustment_in', 2)).toBe(2)
    expect(movementDelta('adjustment_out', 2)).toBe(-2)
  })
})
