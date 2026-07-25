import { describe, expect, it } from 'vitest'
import {
  INVENTORY_LIMITS,
  movementDelta,
  stockStatus,
  validateCreateMovement,
} from '#/modules/inventory/domain/validation'

describe('inventory validation', () => {
  it('requires product, quantity > 0 and reason', () => {
    const errors = validateCreateMovement({
      productId: '  ',
      type: 'entry',
      quantity: 0,
      reason: ' ',
    })
    expect(errors.productId).toBeTruthy()
    expect(errors.quantity).toBeTruthy()
    expect(errors.reason).toBeTruthy()
  })

  it('accepts valid entry', () => {
    const errors = validateCreateMovement({
      productId: 'p1',
      type: 'entry',
      quantity: 10,
      reason: 'Compra',
      notes: 'NF 123',
    })
    expect(errors).toEqual({})
  })

  it('requires reason especially for adjustments', () => {
    const errors = validateCreateMovement({
      productId: 'p1',
      type: 'adjustment_out',
      quantity: 1,
      reason: '',
    })
    expect(errors.reason).toMatch(/motivo/i)
  })

  it('enforces reason and notes length', () => {
    expect(
      validateCreateMovement({
        productId: 'p1',
        type: 'exit',
        quantity: 1,
        reason: 'x'.repeat(INVENTORY_LIMITS.reason + 1),
      }).reason,
    ).toMatch(/máximo/)

    expect(
      validateCreateMovement({
        productId: 'p1',
        type: 'exit',
        quantity: 1,
        reason: 'ok',
        notes: 'y'.repeat(INVENTORY_LIMITS.notes + 1),
      }).notes,
    ).toMatch(/máximo/)
  })

  it('rejects invalid movement type', () => {
    const errors = validateCreateMovement({
      productId: 'p1',
      type: 'return' as 'entry',
      quantity: 1,
      reason: 'x',
    })
    expect(errors.type).toBeTruthy()
  })

  it('re-exports official delta and stockStatus helpers', () => {
    expect(movementDelta('entry', 2)).toBe(2)
    expect(stockStatus(0)).toBe('out_of_stock')
  })
})
