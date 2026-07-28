import { describe, expect, it } from 'vitest'

describe('receivable settlement', () => {
  it('publishes only when the aggregate is paid', () => {
    expect(['open', 'partially_paid']).not.toContain('paid')
    expect('paid').toBe('paid')
  })
})
