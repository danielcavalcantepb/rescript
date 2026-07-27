import { describe, expect, it } from 'vitest'
import {
  assertPurchaseTransition,
  canTransitionPurchaseStatus,
  isPurchaseEditable,
} from '#/modules/purchase/domain/lifecycle'

describe('purchase lifecycle', () => {
  it('allows draft → approved → cancelled/archived', () => {
    expect(canTransitionPurchaseStatus('draft', 'sent')).toBe(true)
    expect(canTransitionPurchaseStatus('sent', 'confirmed')).toBe(true)
    expect(canTransitionPurchaseStatus('confirmed', 'closed')).toBe(true)
    expect(canTransitionPurchaseStatus('confirmed', 'cancelled')).toBe(true)
    expect(canTransitionPurchaseStatus('cancelled', 'draft')).toBe(false)
  })

  it('restores from archived to previous statuses', () => {
    expect(canTransitionPurchaseStatus('archived', 'draft')).toBe(true)
    expect(canTransitionPurchaseStatus('archived', 'approved')).toBe(true)
  })

  it('throws on invalid transition', () => {
    expect(() => assertPurchaseTransition('cancelled', 'confirmed')).toThrow(
      /invalid_purchase_transition/,
    )
  })

  it('only draft is editable', () => {
    expect(isPurchaseEditable('draft')).toBe(true)
    expect(isPurchaseEditable('approved')).toBe(false)
  })
})
