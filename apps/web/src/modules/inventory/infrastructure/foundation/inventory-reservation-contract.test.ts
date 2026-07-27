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
    '20260726130000_inventory_reservation_foundation.sql',
  ),
  'utf8',
)
const api = readFileSync(
  join(root, 'src', 'modules', 'inventory', 'ui', 'reservation-api.ts'),
  'utf8',
)
const salesPage = readFileSync(
  join(root, 'src', 'modules', 'sales', 'ui', 'pages', 'sales-document-page.tsx'),
  'utf8',
)

describe('inventory reservation foundation contract', () => {
  it('models Reservation separately from the physical inventory ledger', () => {
    expect(migration).toContain('create table public.inventory_reservation')
    expect(migration).toContain('create table public.inventory_reservation_item')
    expect(migration).not.toMatch(/insert\s+into\s+public\.inventory_ledger_movement/i)
    expect(migration).not.toMatch(/register_inventory_ledger_movement\s*\(/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.accounts_receivable/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.shipment/i)
    expect(migration).not.toMatch(/insert\s+into\s+public\.invoice/i)
  })

  it('changes only the reserved inventory projection under the official guard', () => {
    expect(migration).toContain("set_config('inventory.allow_projection', 'on', true)")
    expect(migration).toContain('qty_reserved = qty_reserved + v_item.quantity_reserved')
    expect(migration).toContain('qty_reserved = qty_reserved - v_quantity')
    expect(migration).not.toMatch(/qty_on_hand\s*=\s*qty_on_hand\s*[-+]/i)
  })

  it('protects availability, tenant and duplicate source invariants', () => {
    expect(migration).toContain('unique (organization_id, source_type, source_id)')
    expect(migration).toContain('sales_order_not_confirmed')
    expect(migration).toContain('inventory_item_not_found')
    expect(migration).toContain('insufficient_available_stock')
    expect(migration).toContain('reservation_has_permission')
  })

  it('stores immutable item snapshots from the Sales Order', () => {
    for (const field of [
      'product_name',
      'variant_description',
      'sku',
      'unit_code',
      'quantity_reserved',
    ]) {
      expect(migration).toContain(field)
    }
    expect(migration).toContain('from public.sales_order_item i')
  })

  it('provides history and search projection for the Workspace', () => {
    expect(migration).toContain('create table public.inventory_reservation_history')
    expect(migration).toContain('inventory_reservation_history_immutable')
    expect(migration).toContain('create table public.inventory_reservation_search')
    expect(migration).toContain("using gin (to_tsvector('simple', search_text))")
    expect(migration).toContain('list_inventory_reservations')
  })

  it('exposes server-side RPCs with reservation permissions', () => {
    for (const permission of [
      'reservation.read',
      'reservation.create',
      'reservation.activate',
      'reservation.release',
      'reservation.cancel',
    ]) {
      expect(migration).toContain(permission)
      expect(api).toContain(permission)
    }
    expect(api).toContain('createServerFn')
  })

  it('integrates only with Sales Order confirmation and cancellation', () => {
    expect(migration).toContain('create_inventory_reservation_from_sales_order')
    expect(migration).toContain("if p_to = 'confirmed' then")
    expect(migration).toContain("elsif p_to = 'cancelled' then")
    expect(salesPage).toContain('Abrir reserva')
  })
})
