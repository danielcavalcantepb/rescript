import { describe, expect, it } from 'vitest'
import {
  assertReceiptTransition,
  canTransitionReceiptStatus,
  isReceiptEditable,
} from '#/modules/receiving/domain/lifecycle'

describe('receiving lifecycle', () => {
  it('allows draft → posted and blocks posted → draft', () => {
    expect(canTransitionReceiptStatus('draft', 'posted')).toBe(true)
    expect(canTransitionReceiptStatus('posted', 'draft')).toBe(false)
    expect(canTransitionReceiptStatus('posted', 'archived')).toBe(true)
  })

  it('throws on invalid transition', () => {
    expect(() => assertReceiptTransition('posted', 'cancelled')).toThrow(
      /invalid_receipt_transition/,
    )
  })

  it('only draft is editable', () => {
    expect(isReceiptEditable('draft')).toBe(true)
    expect(isReceiptEditable('posted')).toBe(false)
  })
})
