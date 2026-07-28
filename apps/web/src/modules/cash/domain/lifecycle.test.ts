import { describe, expect, it } from 'vitest'
import { canTransitionCashEntry } from './lifecycle'

describe('cash entry lifecycle', () => {
  it('allows posting, reversing and cancelling only from valid states', () => {
    expect(canTransitionCashEntry('draft', 'posted')).toBe(true)
    expect(canTransitionCashEntry('posted', 'reversed')).toBe(true)
    expect(canTransitionCashEntry('draft', 'reversed')).toBe(false)
  })
})
