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
    '20260726140000_inventory_picking_foundation.sql',
  ),
  'utf8',
)
const api = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'picking-api.ts'),
  'utf8',
)
const hooks = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'hooks', 'use-inventory-pickings.ts'),
  'utf8',
)
const pickingPage = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'pages', 'picking-detail-page.tsx'),
  'utf8',
)
const reservationPage = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'pages', 'reservation-detail-page.tsx'),
  'utf8',
)
const salesPage = readFileSync(
  join(root, 'src', 'modules', 'sales', 'ui', 'pages', 'sales-document-page.tsx'),
  'utf8',
)

describe('inventory picking foundation contract', () => {
  it('models Picking as a separate aggregate without inventory or financial side effects', () => {
    expect(migration).toContain('create table public.inventory_picking')
    expect(migration).toContain('create table public.inventory_picking_item')
    expect(migration).not.toMatch(/update\s+public\.inventory_item/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.inventory_ledger_movement/i)
    expect(migration).not.toMatch(/register_inventory_ledger_movement\s*\(/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.stock_movement/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.shipment/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.invoice/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.accounts_receivable/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.payments/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.cash_flow/i)
    expect(migration).not.toMatch(/update\s+public\.inventory_reservation/i)
  })

  it('copies immutable item snapshots from Reservation, never from catalog', () => {
    for (const field of [
      'reservation_item_id',
      'product_name',
      'variant_description',
      'sku',
      'unit_code',
      'quantity_reserved',
      'quantity_picked',
    ]) {
      expect(migration).toContain(field)
    }
    expect(migration).toContain('from public.inventory_reservation_item i')
    expect(migration).not.toMatch(/from\s+public\.product_variant/i)
    expect(migration).not.toMatch(/from\s+public\.product\s/i)
  })

  it('enforces active reservation, no duplicate picking and picked quantity bounds', () => {
    expect(migration).toContain("v_reservation.status <> 'active'")
    expect(migration).toContain('unique (organization_id, reservation_id)')
    expect(migration).toContain('check (quantity_picked <= quantity_reserved)')
    expect(migration).toContain('picked_quantity_exceeds_reserved')
    expect(migration).toContain('picking_requires_active_reservation_items')
  })

  it('implements lifecycle RPCs with server-side permissions and deterministic item locking', () => {
    for (const rpcName of [
      'create_inventory_picking',
      'start_inventory_picking',
      'update_inventory_picking_items',
      'complete_inventory_picking',
      'cancel_inventory_picking',
      'get_inventory_picking',
      'list_inventory_pickings',
    ]) {
      expect(migration).toContain(rpcName)
      expect(api).toContain(rpcName)
    }
    for (const permission of [
      'picking.read',
      'picking.create',
      'picking.edit',
      'picking.start',
      'picking.complete',
      'picking.cancel',
    ]) {
      expect(migration).toContain(permission)
      expect(api).toContain(permission)
    }
    expect(migration).toContain('order by i.variant_id, i.id')
    expect(migration).toContain('for update of i')
  })

  it('keeps append-only history, audit and search projection for the Workspace', () => {
    expect(migration).toContain('create table public.inventory_picking_history')
    expect(migration).toContain('inventory_picking_history_immutable')
    expect(migration).toContain('create table public.inventory_picking_search')
    expect(migration).toContain("using gin (to_tsvector('simple', search_text))")
    for (const event of [
      'PickingCreated',
      'PickingStarted',
      'PickingUpdated',
      'PickingCompleted',
      'PickingCancelled',
    ]) {
      expect(migration).toContain(event)
    }
    expect(migration).toContain('picking_record_audit')
  })

  it('exposes tenant-scoped hooks, cache invalidation and Workspace actions', () => {
    expect(hooks).toContain('inventoryQueryKeys.pickings')
    expect(hooks).toContain('inventoryQueryKeys.pickingDetail')
    expect(hooks).toContain('invalidateQueries')
    expect(pickingPage).toContain('Itens para separação')
    expect(pickingPage).toContain('Histórico')
    expect(pickingPage).toContain('não altera On')
    expect(reservationPage).toContain('Criar Picking')
    expect(salesPage).toContain('Abrir Picking')
  })
})
