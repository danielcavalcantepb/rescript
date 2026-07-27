import { describe, expect, it } from 'vitest'
import {
  assertSupplierTransition,
  canTransitionSupplierStatus,
} from '#/modules/suppliers/domain/lifecycle'

describe('Supplier lifecycle', () => {
  it('allows draft→active→inactive→archived→active', () => {
    expect(canTransitionSupplierStatus('draft', 'active')).toBe(true)
    expect(canTransitionSupplierStatus('active', 'inactive')).toBe(true)
    expect(canTransitionSupplierStatus('inactive', 'archived')).toBe(true)
    expect(canTransitionSupplierStatus('archived', 'active')).toBe(true)
  })

  it('blocks illegal jumps', () => {
    expect(canTransitionSupplierStatus('draft', 'inactive')).toBe(false)
    expect(() => assertSupplierTransition('active', 'draft')).toThrow(
      /invalid_supplier_transition/,
    )
  })
})
