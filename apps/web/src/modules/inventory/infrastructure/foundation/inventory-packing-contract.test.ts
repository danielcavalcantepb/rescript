import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const migration = readFileSync(
  join(
    root,
    '..',
    '..',
    'supabase',
    'migrations',
    '20260726150000_inventory_packing_foundation.sql',
  ),
  'utf8',
)
const api = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'packing-api.ts'),
  'utf8',
)
const hooks = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'hooks', 'use-inventory-packings.ts'),
  'utf8',
)
const packingPage = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'pages', 'packing-detail-page.tsx'),
  'utf8',
)
const packingsPage = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'pages', 'packings-list-page.tsx'),
  'utf8',
)
const pickingPage = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'pages', 'picking-detail-page.tsx'),
  'utf8',
)
const salesPage = readFileSync(
  join(root, 'src', 'modules', 'sales', 'ui', 'pages', 'sales-document-page.tsx'),
  'utf8',
)

describe('inventory packing foundation contract', () => {
  it('models Packing as a separate aggregate without inventory or financial side effects', () => {
    expect(migration).toContain('create table public.inventory_packing')
    expect(migration).toContain('create table public.inventory_packing_item')
    expect(migration).not.toMatch(/update\s+public\.inventory_item/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.inventory_ledger_movement/i)
    expect(migration).not.toMatch(/register_inventory_ledger_movement\s*\(/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.stock_movement/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.shipment/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.invoice/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.accounts_receivable/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.payments/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.cash_flow/i)
    expect(migration).not.toMatch(/update\s+public\.inventory_picking\s/i)
    expect(migration).not.toMatch(/update\s+public\.inventory_reservation/i)
  })

  it('copies immutable item snapshots from Picking, never from catalog', () => {
    for (const field of [
      'picking_item_id',
      'reservation_item_id',
      'product_name',
      'variant_description',
      'sku',
      'unit_code',
      'quantity_picked',
    ]) {
      expect(migration).toContain(field)
    }
    expect(migration).toContain('from public.inventory_picking_item i')
    expect(migration).not.toMatch(/from\s+public\.product_variant/i)
    expect(migration).not.toMatch(/from\s+public\.product\s/i)
    expect(api).not.toContain('updateInventoryPackingItems')
    expect(packingPage).not.toContain('useUpdateInventoryPackingItems')
  })

  it('enforces completed picking and no duplicate packing', () => {
    expect(migration).toContain("v_picking.status <> 'completed'")
    expect(migration).toContain('unique (organization_id, picking_id)')
    expect(migration).toContain('packing_requires_completed_picking_items')
    expect(migration).toContain('quantity_picked numeric(19, 6) not null check (quantity_picked > 0)')
  })

  it('implements lifecycle RPCs with server-side permissions', () => {
    for (const rpcName of [
      'create_inventory_packing',
      'start_inventory_packing',
      'complete_inventory_packing',
      'cancel_inventory_packing',
      'get_inventory_packing',
      'list_inventory_packings',
    ]) {
      expect(migration).toContain(rpcName)
      expect(api).toContain(rpcName)
    }
    for (const permission of [
      'packing.read',
      'packing.create',
      'packing.edit',
      'packing.complete',
      'packing.cancel',
    ]) {
      expect(migration).toContain(permission)
      expect(api).toContain(permission)
    }
  })

  it('keeps append-only history, audit and search projection for the Workspace', () => {
    expect(migration).toContain('create table public.inventory_packing_history')
    expect(migration).toContain('inventory_packing_history_immutable')
    expect(migration).toContain('create table public.inventory_packing_search')
    expect(migration).toContain("using gin (to_tsvector('simple', search_text))")
    for (const event of [
      'PackingCreated',
      'PackingStarted',
      'PackingCompleted',
      'PackingCancelled',
    ]) {
      expect(migration).toContain(event)
    }
    expect(migration).toContain('packing_record_audit')
  })

  it('exposes tenant-scoped hooks, cache invalidation and Workspace actions', () => {
    expect(hooks).toContain('inventoryQueryKeys.packings')
    expect(hooks).toContain('inventoryQueryKeys.packingDetail')
    expect(hooks).toContain('invalidateQueries')
    expect(packingsPage).toContain('Embalagens')
    expect(packingPage).toContain('Itens embalados')
    expect(packingPage).toContain('Histórico')
    expect(packingPage).toContain('não altera On')
    expect(pickingPage).toContain('Criar Packing')
    expect(salesPage).toContain('Abrir Packing')
  })
})
