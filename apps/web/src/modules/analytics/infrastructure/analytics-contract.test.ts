import { describe, expect, it } from 'vitest'
import { permissionsForRole } from '@rescript/permissions'

describe('analytics permissions contract', () => {
  it('keeps metrics separated from command center insights', () => {
    expect(permissionsForRole('viewer')).toContain('analytics.view')
    expect(permissionsForRole('viewer')).toContain('insights.view')
  })
})
