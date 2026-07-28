import { describe, expect, it } from 'vitest'
import { SourceTypeRegistry, mapFiscalSourceToContext, type FiscalSource } from './source-contract'

const source: FiscalSource = { organization_id: 'org', source_type: 'SALES_ORDER', source_id: 'order', source_number: 'SO-1', fiscal_date: '2026-07-28', responsible_user_id: 'user', fiscal_operation_id: 'op', tax_profile_id: 'profile', origin_state: 'SP', destination_state: 'RJ', items: [{ product_variant_id: 'variant', sku: 'SKU-1', quantity: 1, unit: 'UN', warehouse: null, metadata: { source: 'test' } }] }

describe('fiscal source contract', () => {
  it('serializes and maps the canonical context without database access', () => {
    expect(JSON.parse(JSON.stringify(source)).source_type).toBe('SALES_ORDER')
    expect(mapFiscalSourceToContext(source, source.items[0])).toMatchObject({ organizationId: 'org', variantId: 'variant', operationId: 'op' })
  })
  it('registers only approved source types', () => expect(Object.keys(SourceTypeRegistry)).toHaveLength(4))
})
