import { describe, expect, it } from 'vitest'
import {
  assertPickingTransition,
  pickingOpenQuantity,
  pickingStatusLabel,
} from './lifecycle'
import {
  validatePickedWithinReserved,
  validatePickingItemUpdates,
  validatePickingQuantity,
} from './validation'

describe('inventory picking domain', () => {
  it('allows only the picking lifecycle transitions', () => {
    expect(() => assertPickingTransition('draft', 'in_progress')).not.toThrow()
    expect(() =>
      assertPickingTransition('in_progress', 'partially_picked'),
    ).not.toThrow()
    expect(() =>
      assertPickingTransition('partially_picked', 'completed'),
    ).not.toThrow()
    expect(() => assertPickingTransition('in_progress', 'cancelled')).not.toThrow()
    expect(() => assertPickingTransition('completed', 'cancelled')).toThrow(
      'invalid_picking_transition',
    )
  })

  it('keeps operational labels stable', () => {
    expect(pickingStatusLabel('in_progress')).toBe('Em separação')
    expect(pickingStatusLabel('partially_picked')).toBe(
      'Separado parcialmente',
    )
  })

  it('accepts zero picked quantity and rejects negative or malformed values', () => {
    expect(validatePickingQuantity('0')).toBe('0')
    expect(validatePickingQuantity('1.500000')).toBe('1.500000')
    expect(() => validatePickingQuantity('-1')).toThrow(
      'invalid_picking_quantity',
    )
    expect(() => validatePickingQuantity('1.1234567')).toThrow(
      'invalid_picking_quantity',
    )
  })

  it('does not allow picked quantity above reserved quantity', () => {
    expect(pickingOpenQuantity('10', '3')).toBe(7)
    expect(() => pickingOpenQuantity('10', '11')).toThrow(
      'invalid_picking_quantity',
    )
    expect(() => validatePickedWithinReserved('11', '10')).toThrow(
      'picked_quantity_exceeds_reserved',
    )
  })

  it('validates item update commands', () => {
    expect(() =>
      validatePickingItemUpdates([{ itemId: 'a', quantity: '0' }]),
    ).not.toThrow()
    expect(() =>
      validatePickingItemUpdates([
        { itemId: 'a', quantity: '2' },
        { itemId: 'a', quantity: '1' },
      ]),
    ).toThrow('invalid_picking_items')
  })
})
