import { describe, expect, it } from 'vitest'
import { toSalesFiscalSource } from './sales-adapter'

describe('sales fiscal source adapter', () => {
  it('emits a canonical SALES_ORDER source without mutating snapshots', () => {
    const items = [{ product_variant_id: 'variant', sku: 'SKU-1', quantity: 1, unit: 'UN', warehouse: null, metadata: { source: 'sales' } }]
    const source = toSalesFiscalSource({ organization_id: 'org', source_id: 'order', source_number: 'SO-1', fiscal_date: '2026-07-28', responsible_user_id: 'user', fiscal_operation_id: 'op', tax_profile_id: 'profile', origin_state: 'SP', destination_state: 'RJ', items })
    expect(source.source_type).toBe('SALES_ORDER')
    expect(source.items).not.toBe(items)
    expect(source.items[0].sku).toBe('SKU-1')
  })
})
