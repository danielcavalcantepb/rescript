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
    '20260726160000_inventory_shipment_foundation.sql',
  ),
  'utf8',
)
const api = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'shipment-api.ts'),
  'utf8',
)
const hooks = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'hooks', 'use-inventory-shipments.ts'),
  'utf8',
)
const shipmentPage = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'pages', 'shipment-detail-page.tsx'),
  'utf8',
)
const shipmentsPage = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'pages', 'shipments-list-page.tsx'),
  'utf8',
)
const packingPage = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'pages', 'packing-detail-page.tsx'),
  'utf8',
)
const salesPage = readFileSync(
  join(root, 'src', 'modules', 'sales', 'ui', 'pages', 'sales-document-page.tsx'),
  'utf8',
)

function sqlFunction(name: string) {
  const marker = `create or replace function public.${name}`
  const start = migration.indexOf(marker)
  if (start < 0) return ''
  const next = migration.indexOf('\ncreate or replace function public.', start + marker.length)
  return migration.slice(start, next < 0 ? migration.length : next)
}

describe('inventory shipment foundation contract', () => {
  it('models Shipment as the dispatch aggregate and keeps forbidden integrations out', () => {
    expect(migration).toContain('create table public.inventory_shipment')
    expect(migration).toContain('create table public.inventory_shipment_item')
    expect(migration).not.toMatch(/insert\s+into\s+public\.invoice/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.accounts_receivable/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.receipts/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.payments/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.cash_flow/i)
    expect(migration).not.toMatch(/documento_fiscal|nf-e/i)
    expect(migration).not.toMatch(/update\s+public\.inventory_packing\s/i)
  })

  it('copies immutable item snapshots from Packing, never from catalog', () => {
    for (const field of [
      'packing_item_id',
      'picking_item_id',
      'reservation_item_id',
      'product_name',
      'variant_description',
      'sku',
      'unit_code',
      'quantity_packed',
      'quantity_shipped',
    ]) {
      expect(migration).toContain(field)
    }
    expect(migration).toContain('from public.inventory_packing_item i')
    expect(migration).not.toMatch(/from\s+public\.product_variant/i)
    expect(migration).not.toMatch(/from\s+public\.product\s/i)
    expect(api).not.toContain('updateInventoryShipmentItems')
  })

  it('enforces completed Packing, no duplicate Shipment and shipped quantity bounds', () => {
    expect(migration).toContain("v_packing.status <> 'completed'")
    expect(migration).toContain('unique (organization_id, packing_id)')
    expect(migration).toContain('shipment_requires_completed_packing_items')
    expect(migration).toContain('check (quantity_shipped <= quantity_packed)')
    expect(migration).toContain('invalid_shipped_quantity')
  })

  it('implements dispatch as the only inventory-effecting lifecycle step', () => {
    expect(migration).toContain('create or replace function public.dispatch_inventory_shipment')
    expect(migration).toContain('register_inventory_ledger_movement')
    expect(migration).toContain("'exit'")
    expect(migration).toContain("'inventory_shipment'")
    expect(migration).toContain('set qty_reserved = qty_reserved - v_item.quantity_shipped')
    expect(migration).toContain('set quantity_released = quantity_released + v_item.quantity_shipped')
    expect(migration).toContain('order by variant_id, location_id, id')
    expect(migration).toContain('for update')
    expect(migration).toContain("v_idem || ':item:' || v_item.id::text")
    expect(sqlFunction('create_inventory_shipment')).not.toContain(
      'register_inventory_ledger_movement',
    )
    expect(sqlFunction('mark_inventory_shipment_ready')).not.toContain(
      'register_inventory_ledger_movement',
    )
    expect(sqlFunction('cancel_inventory_shipment')).not.toContain(
      'register_inventory_ledger_movement',
    )
  })

  it('implements lifecycle RPCs with server-side permissions', () => {
    for (const rpcName of [
      'create_inventory_shipment',
      'mark_inventory_shipment_ready',
      'dispatch_inventory_shipment',
      'complete_inventory_shipment',
      'cancel_inventory_shipment',
      'get_inventory_shipment',
      'list_inventory_shipments',
    ]) {
      expect(migration).toContain(rpcName)
      expect(api).toContain(rpcName)
    }
    for (const permission of [
      'shipment.read',
      'shipment.create',
      'shipment.ready',
      'shipment.dispatch',
      'shipment.complete',
      'shipment.cancel',
    ]) {
      expect(migration).toContain(permission)
      expect(api).toContain(permission)
    }
  })

  it('keeps append-only history, audit and search projection for the Workspace', () => {
    expect(migration).toContain('create table public.inventory_shipment_history')
    expect(migration).toContain('inventory_shipment_history_immutable')
    expect(migration).toContain('create table public.inventory_shipment_search')
    expect(migration).toContain("using gin (to_tsvector('simple', search_text))")
    for (const event of [
      'ShipmentCreated',
      'ShipmentReady',
      'ShipmentDispatched',
      'ShipmentDelivered',
      'ShipmentCancelled',
    ]) {
      expect(migration).toContain(event)
    }
    expect(migration).toContain('shipment_record_audit')
  })

  it('exposes tenant-scoped hooks, cache invalidation and Workspace actions', () => {
    expect(hooks).toContain('inventoryQueryKeys.shipments')
    expect(hooks).toContain('inventoryQueryKeys.shipmentDetail')
    expect(hooks).toContain('invalidateQueries')
    expect(shipmentsPage).toContain('Expedições')
    expect(shipmentPage).toContain('Itens expedidos')
    expect(shipmentPage).toContain('Logística')
    expect(shipmentPage).toContain('Movimentos de estoque')
    expect(shipmentPage).toContain('Não gera')
    expect(packingPage).toContain('Criar Shipment')
    expect(salesPage).toContain('Abrir Shipment')
  })
})
