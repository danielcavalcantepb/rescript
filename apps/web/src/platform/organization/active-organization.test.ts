import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearActiveOrganizationId,
  readActiveOrganizationId,
  writeActiveOrganizationId,
} from '#/platform/organization/active-organization'

describe('active organization storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('isolates preference per key and clears on logout helper', () => {
    writeActiveOrganizationId('org_1')
    expect(readActiveOrganizationId()).toBe('org_1')
    clearActiveOrganizationId()
    expect(readActiveOrganizationId()).toBeNull()
  })
})
