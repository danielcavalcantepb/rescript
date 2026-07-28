import { describe, expect, it } from 'vitest'
import { assertReturnQuantity, canTransitionPurchaseReturn } from './lifecycle'

describe('purchase return lifecycle', () => {
  it('allows processing, completion and cancellation transitions', () => {
    expect(canTransitionPurchaseReturn('draft', 'processing')).toBe(true)
    expect(canTransitionPurchaseReturn('processing', 'completed')).toBe(true)
    expect(canTransitionPurchaseReturn('draft', 'completed')).toBe(false)
  })

  it('prevents returning more than the received balance', () => {
    expect(() => assertReturnQuantity(3, 4)).toThrow('return_quantity_exceeds_received')
    expect(() => assertReturnQuantity(3, 2)).not.toThrow()
  })
})
