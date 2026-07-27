import { describe, expect, it } from 'vitest'
import { can, permissionsForRole } from '@rescript/permissions'

describe('Inventory Foundation permissions', () => {
  it('manager and inventory roles get foundation keys', () => {
    const manager = permissionsForRole('manager')
    const inventory = permissionsForRole('inventory')
    for (const key of [
      'inventory.read',
      'inventory.create',
      'inventory.edit',
      'inventory.archive',
      'inventory.restore',
      'inventory.locations.manage',
    ] as const) {
      expect(can(manager, key)).toBe(true)
      expect(can(inventory, key)).toBe(true)
    }
  })

  it('viewer can read but not manage locations or create items', () => {
    const viewer = permissionsForRole('viewer')
    expect(can(viewer, 'inventory.read')).toBe(true)
    expect(can(viewer, 'inventory.create')).toBe(false)
    expect(can(viewer, 'inventory.locations.manage')).toBe(false)
  })

  it('move/adjust imply inventory.read', () => {
    expect(can(['inventory.move'], 'inventory.read')).toBe(true)
    expect(can(['inventory.adjust'], 'inventory.read')).toBe(true)
  })
})
