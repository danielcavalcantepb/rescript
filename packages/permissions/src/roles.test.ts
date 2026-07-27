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
    expect(grants).toContain('sales.convert')
    expect(grants).toContain('reservation.activate')
    expect(grants).toContain('picking.complete')
    expect(grants).toContain('packing.complete')
    expect(grants).toContain('shipment.dispatch')
  })

  it('viewer is read-only', () => {
    const grants = permissionsForRole('viewer')
    expect(grants).toContain('customers.read')
    expect(grants).toContain('inventory.read')
    expect(grants).not.toContain('customers.write')
    expect(grants).not.toContain('inventory.move')
    expect(grants).not.toContain('sales.confirm')
    expect(grants).not.toContain('sales.convert')
    expect(grants).toContain('reservation.read')
    expect(grants).toContain('picking.read')
    expect(grants).toContain('packing.read')
    expect(grants).toContain('shipment.read')
    expect(grants).not.toContain('reservation.activate')
    expect(grants).not.toContain('picking.start')
    expect(grants).not.toContain('packing.complete')
    expect(grants).not.toContain('shipment.dispatch')
    expect(grants).not.toContain('org.settings')
  })

  it('inventory role can move, adjust and manage foundation', () => {
    const grants = permissionsForRole('inventory')
    expect(grants).toContain('inventory.read')
    expect(grants).toContain('inventory.move')
    expect(grants).toContain('inventory.adjust')
    expect(grants).toContain('inventory.create')
    expect(grants).toContain('inventory.locations.manage')
    expect(grants).toContain('reservation.activate')
    expect(grants).toContain('reservation.release')
    expect(grants).toContain('picking.start')
    expect(grants).toContain('picking.complete')
    expect(grants).toContain('packing.create')
    expect(grants).toContain('packing.complete')
    expect(grants).toContain('shipment.create')
    expect(grants).toContain('shipment.dispatch')
  })

  it('seller cannot manage members', () => {
    expect(ROLE_PERMISSIONS.seller).not.toContain('members.invite')
    expect(ROLE_PERMISSIONS.seller).not.toContain('members.manage_roles')
    expect(ROLE_PERMISSIONS.seller).toContain('sales.send')
    expect(ROLE_PERMISSIONS.seller).toContain('sales.approve')
    expect(ROLE_PERMISSIONS.seller).toContain('sales.reject')
    expect(ROLE_PERMISSIONS.seller).toContain('sales.convert')
    expect(ROLE_PERMISSIONS.seller).toContain('reservation.create')
    expect(ROLE_PERMISSIONS.seller).toContain('reservation.activate')
    expect(ROLE_PERMISSIONS.seller).toContain('picking.create')
    expect(ROLE_PERMISSIONS.seller).toContain('picking.complete')
    expect(ROLE_PERMISSIONS.seller).toContain('packing.create')
    expect(ROLE_PERMISSIONS.seller).toContain('packing.complete')
    expect(ROLE_PERMISSIONS.seller).toContain('shipment.create')
    expect(ROLE_PERMISSIONS.seller).toContain('shipment.dispatch')
  })
})
