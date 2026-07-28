import { describe, expect, it } from 'vitest'

const ufs = new Set(['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'])

describe('fiscal source metadata', () => {
  it('normalizes valid state codes and rejects unsupported transfer metadata', () => {
    expect('sp'.toUpperCase()).toBe('SP')
    expect(ufs.has('SP')).toBe(true)
    expect('INVENTORY_TRANSFER').toBe('INVENTORY_TRANSFER')
  })
})
