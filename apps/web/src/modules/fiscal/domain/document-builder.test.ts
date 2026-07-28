import { describe, expect, it } from 'vitest'
import { buildFiscalDocument } from './document-builder'

describe('fiscal document builder', () => {
  it('captures resolved tax data as item snapshots', () => {
    const resolved = { cfop: '5102', cst: '00', csosn: null, origin: '0', operationId: 'op', taxProfileId: 'profile', variantId: 'variant' }
    const result = buildFiscalDocument({ type: 'sale', sourceId: 'sale-1', operationId: 'op', taxProfileId: 'profile', items: [{ context: { organizationId: 'org', operationId: 'op', taxProfileId: 'profile', variantId: 'variant', originState: 'SP', destinationState: 'RJ' }, quantity: 2, unit: 'UN', variant: { id: 'variant', name: 'Produto', sku: 'SKU-1' } }] }, () => resolved)
    expect(result.items[0]).toMatchObject({ cfop: '5102', quantity: 2, variant: { sku: 'SKU-1' } })
  })
})
