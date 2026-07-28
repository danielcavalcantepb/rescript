import { describe, expect, it } from 'vitest'
import { resolveTaxRule } from './tax-engine'

const context = { organizationId: 'org', operationId: 'sale', taxProfileId: 'profile', variantId: 'variant', originState: 'SP', destinationState: 'RJ' }
const rule = { cfop: '5102', cst: '00', csosn: null, origin: '0', operationId: 'sale', taxProfileId: 'profile', variantId: 'variant' }

describe('tax engine resolver', () => {
  it('resolves one matching rule', () => expect(resolveTaxRule(context, [rule])).toEqual(rule))
  it('rejects missing and ambiguous rules', () => {
    expect(() => resolveTaxRule(context, [])).toThrow('fiscal_rule_not_found')
    expect(() => resolveTaxRule(context, [rule, rule])).toThrow('fiscal_rule_ambiguous')
  })
})
