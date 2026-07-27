import { describe, expect, it } from 'vitest'
import { can } from '@rescript/permissions'
import { PriceResolutionPolicy } from '#/modules/catalog/domain/policies/price-resolution-policy'

describe('price engine UI permissions', () => {
  it('products.write implies prices.* and products.read implies prices.read/resolve', () => {
    expect(can(['products.write'], 'prices.create')).toBe(true)
    expect(can(['products.write'], 'prices.archive')).toBe(true)
    expect(can(['products.read'], 'prices.read')).toBe(true)
    expect(can(['products.read'], 'prices.resolve')).toBe(true)
    expect(can(['products.edit'], 'prices.edit')).toBe(false)
  })

  it('keeps validity classification in domain (not UI)', () => {
    expect(
      PriceResolutionPolicy.classifyEntryValidity(
        '2026-01-01T00:00:00.000Z',
        null,
        '2026-06-01T00:00:00.000Z',
      ),
    ).toBe('unbounded')
  })
})
