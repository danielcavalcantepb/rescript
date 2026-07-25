import { describe, expect, it } from 'vitest'
import {
  permissionsForRole,
  ROLE_PERMISSIONS,
  ROLE_PRESETS,
} from './roles'

describe('role presets → permissions', () => {
  it('exposes seven initial presets', () => {
    expect(ROLE_PRESETS).toEqual([
      'owner',
      'admin',
      'manager',
      'seller',
      'inventory',
      'finance',
      'viewer',
    ])
  })

  it('owner has org.settings and members.manage_roles', () => {
    const grants = permissionsForRole('owner')
    expect(grants).toContain('org.settings')
    expect(grants).toContain('members.manage_roles')
    expect(grants).toContain('sales.confirm')
  })

  it('viewer is read-only', () => {
    const grants = permissionsForRole('viewer')
    expect(grants).toContain('customers.read')
    expect(grants).toContain('inventory.read')
    expect(grants).not.toContain('customers.write')
    expect(grants).not.toContain('inventory.move')
    expect(grants).not.toContain('sales.confirm')
    expect(grants).not.toContain('org.settings')
  })

  it('inventory role can move and adjust', () => {
    const grants = permissionsForRole('inventory')
    expect(grants).toContain('inventory.read')
    expect(grants).toContain('inventory.move')
    expect(grants).toContain('inventory.adjust')
  })

  it('seller cannot manage members', () => {
    expect(ROLE_PERMISSIONS.seller).not.toContain('members.invite')
    expect(ROLE_PERMISSIONS.seller).not.toContain('members.manage_roles')
  })
})
