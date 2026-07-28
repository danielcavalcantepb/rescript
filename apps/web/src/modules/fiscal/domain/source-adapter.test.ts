import { describe, expect, it } from 'vitest'
import { assertFiscalSourceEligible } from './source-adapter'

describe('fiscal source adapter', () => {
  it('rejects ineligible and empty operational sources', () => {
    expect(() => assertFiscalSourceEligible({ organizationId: 'org', sourceType: 'SALES_ORDER', sourceId: 'order', status: 'ineligible', type: 'sale', items: [] })).toThrow('fiscal_source_ineligible')
  })
})
