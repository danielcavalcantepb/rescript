// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(
    process.cwd(),
    '../../supabase/migrations/20260727180000_inventory_security_canonicalization.sql',
  ),
  'utf8',
)

describe('inventory security and canonicalization migration', () => {
  it('blocks direct physical projection writes on insert and update', () => {
    expect(migration).toContain("if tg_op = 'INSERT'")
    expect(migration).toContain('new.qty_on_hand <> 0')
    expect(migration).toContain('new.qty_reserved <> 0')
    expect(migration).toContain('inventory_item_qty_projection_only')
    expect(migration).toContain('before insert or update')
  })

  it('uses permission-aware RLS for every inventory table', () => {
    for (const policy of [
      'stock_location_read',
      'stock_location_create',
      'stock_location_update',
      'inventory_item_read',
      'inventory_item_create_zero_projection',
      'inventory_item_update_metadata',
      'inventory_item_history_read',
      'inventory_item_history_append',
      'inventory_ledger_movement_read',
    ]) {
      expect(migration).toContain(`policy ${policy}`)
    }
    expect(migration).not.toContain(
      'create policy inventory_ledger_movement_select_member',
    )
  })

  it('checks operation-specific permissions inside SQL RPCs', () => {
    for (const permission of [
      'inventory.movements.create',
      'inventory.adjust',
      'inventory.transfer',
      'inventory.reverse',
    ]) {
      expect(migration).toContain(`'${permission}'`)
    }
    expect(migration).toContain('inventory_require_permission')
    expect(migration).toContain('apply_inventory_ledger_movement')
    expect(migration).toContain('apply_inventory_ledger_transfer')
  })

  it('persists immutable audit and exposes read-only reconciliation', () => {
    expect(migration).toContain('create table if not exists public.audit_event')
    expect(migration).toContain('audit_event_immutable')
    expect(migration).toContain('InventoryMovementRegistered')
    expect(migration).toContain('StockLocationCreated')
    expect(migration).toContain('InventoryItemCreated')
    expect(migration).toContain('reconcile_inventory_ledger')
    expect(migration).toContain('balance_divergence')
    expect(migration).toContain('missing_ledger_movement')
    expect(migration).not.toMatch(
      /reconcile_inventory_ledger[\s\S]*update public\.inventory_item/i,
    )
  })
})
