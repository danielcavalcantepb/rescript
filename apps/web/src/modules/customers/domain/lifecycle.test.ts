import { describe, expect, it } from 'vitest'
import {
  assertCustomerTransition,
  canTransitionCustomerStatus,
} from '#/modules/customers/domain/lifecycle'

describe('Customer lifecycle', () => {
  it('allows draft→active→inactive→archived→active', () => {
    expect(canTransitionCustomerStatus('draft', 'active')).toBe(true)
    expect(canTransitionCustomerStatus('active', 'inactive')).toBe(true)
    expect(canTransitionCustomerStatus('inactive', 'archived')).toBe(true)
    expect(canTransitionCustomerStatus('archived', 'active')).toBe(true)
  })

  it('blocks illegal jumps', () => {
    expect(canTransitionCustomerStatus('draft', 'inactive')).toBe(false)
    expect(() => assertCustomerTransition('active', 'draft')).toThrow(
      /invalid_customer_transition/,
    )
  })
})
