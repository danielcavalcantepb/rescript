import { describe, expect, it } from 'vitest'

describe('fiscal foundation', () => {
  it('keeps fiscal classification external to product variants', () => {
    const classification = { variantId: 'variant-1', taxProfileId: 'profile-1' }
    expect(classification).not.toHaveProperty('ncm')
    expect(classification.taxProfileId).toBe('profile-1')
  })
})
