import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const migration = readFileSync(
  join(root, '..', '..', 'supabase', 'migrations', '20260726120000_sales_foundation.sql'),
  'utf8',
)
const api = readFileSync(
  join(root, 'src', 'modules', 'sales', 'ui', 'sales-api.ts'),
  'utf8',
)
const routesLegacy = [
  readFileSync(join(root, 'src', 'routes', '_app', 'vendas', 'index.tsx'), 'utf8'),
  readFileSync(join(root, 'src', 'routes', '_app', 'vendas', '$saleId.tsx'), 'utf8'),
].join('\n')

describe('sales hardening contracts', () => {
  it('blocks quotation bypass during direct sales order creation', () => {
    expect(migration).toContain("if p_quotation is not null then raise exception 'use_convert_quotation_to_sales_order'")
    expect(api).toContain('p_quotation:null')
  })

  it('keeps quotation conversion idempotent and snapshot based', () => {
    expect(migration).toContain('select id into v_id from sales_order where organization_id=p_org and quotation_id=p_quotation')
    expect(migration).toContain('if found then return v_id; end if;')
    expect(migration).toContain('select organization_id,v_id,product_id,variant_id,product_name,variant_description,sku,unit_code,quantity,unit_price,currency,discount,subtotal,total,price_list_id,price_source,price_rule_snapshot,sort_order from quotation_item')
    expect(migration).toContain('unique(organization_id,quotation_id)')
  })

  it('requires granular server-side sales permissions', () => {
    for (const permission of [
      'sales.read',
      'sales.create',
      'sales.edit',
      'sales.send',
      'sales.approve',
      'sales.reject',
      'sales.convert',
      'sales.confirm',
      'sales.cancel',
      'sales.archive',
    ]) {
      expect(migration).toContain(permission)
    }
    expect(migration).toContain('sales_require_permission')
    expect(api).toContain("'sales.convert'")
    expect(api).toContain("'sales.approve'")
    expect(api).toContain("'sales.reject'")
  })

  it('validates price list snapshots against Pricing tables', () => {
    expect(migration).toContain('join price_list_entry ple')
    expect(migration).toContain("pl.status='active'")
    expect(migration).toContain('ple.variant_id=v_variant')
    expect(migration).toContain('price_rule_snapshot')
    expect(migration).toContain("'manual_price_denied'")
  })

  it('uses a search projection compatible with the GIN tsvector index', () => {
    expect(migration).toContain("using gin(to_tsvector('simple',search_text))")
    expect(migration).toContain("to_tsvector('simple',search_text) @@ plainto_tsquery")
    expect(migration).toContain('quotation_number')
    expect(migration).toContain('valid_until')
    expect(migration).toContain('issue_date')
  })

  it('does not introduce forbidden Sales Foundation side effects', () => {
    expect(migration).not.toContain('accounts_receivable(')
    expect(migration).not.toContain('inventory_movement')
    expect(migration).not.toContain('payment_allocation')
    expect(migration).not.toContain('invoice')
    expect(migration).not.toContain('shipment')
  })

  it('keeps legacy vendas routes as compatibility redirects only', () => {
    expect(routesLegacy).toContain('Legacy route')
    expect(routesLegacy).toContain("'/sales/orders'")
    expect(routesLegacy).not.toContain('#/mocks/data')
  })
})
