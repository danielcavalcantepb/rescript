import { describe, expect, it } from 'vitest'
import { assertPackingTransition, packingStatusLabel } from './lifecycle'
import {
  assertPackingQuantityImmutable,
  validatePackingQuantity,
} from './validation'

describe('inventory packing domain', () => {
  it('allows only the packing lifecycle transitions', () => {
    expect(() => assertPackingTransition('draft', 'in_progress')).not.toThrow()
    expect(() => assertPackingTransition('in_progress', 'completed')).not.toThrow()
    expect(() => assertPackingTransition('draft', 'cancelled')).not.toThrow()
    expect(() => assertPackingTransition('completed', 'cancelled')).toThrow(
      'invalid_packing_transition',
    )
    expect(() => assertPackingTransition('cancelled', 'in_progress')).toThrow(
      'invalid_packing_transition',
    )
  })

  it('keeps operational labels stable', () => {
    expect(packingStatusLabel('in_progress')).toBe('Em embalagem')
    expect(packingStatusLabel('completed')).toBe('Embalado')
  })

  it('requires positive picked quantity snapshots', () => {
    expect(validatePackingQuantity('1.500000')).toBe('1.500000')
    expect(() => validatePackingQuantity('0')).toThrow(
      'invalid_packing_quantity',
    )
    expect(() => validatePackingQuantity('-1')).toThrow(
      'invalid_packing_quantity',
    )
  })

  it('does not allow quantity changes after copied snapshot', () => {
    expect(() => assertPackingQuantityImmutable('2', '2')).not.toThrow()
    expect(() => assertPackingQuantityImmutable('2', '3')).toThrow(
      'packing_quantity_is_immutable',
    )
  })
})
