import { describe, expect, it, vi } from 'vitest'
import {
  invalidateOrganizationScope,
  queryKeys,
} from '#/platform/cache/query-keys'

describe('query key isolation', () => {
  it('scopes domain keys by organization id', () => {
    expect(queryKeys.customers.all('org_a')).not.toEqual(
      queryKeys.customers.all('org_b'),
    )
    expect(queryKeys.permissions.all('org_a')[2]).toBe('org_a')
  })

  it('invalidates org-scoped keys', () => {
    const invalidate = vi.fn()
    invalidateOrganizationScope(invalidate, 'org_x')
    expect(invalidate).toHaveBeenCalled()
    expect(
      invalidate.mock.calls.some(
        (call) => JSON.stringify(call[0]).includes('org_x'),
      ),
    ).toBe(true)
  })
})
