import { describe, expect, it } from 'vitest'
import { PriceResolutionPolicy } from '#/modules/catalog/domain/policies/price-resolution-policy'
import { createDefaultPriceList } from '#/modules/catalog/domain/factories/price-list-factory'
import type { PriceList } from '#/modules/catalog/domain/types'

function listWithEntry(
  base: PriceList,
  overrides: Partial<PriceList> & {
    variantId: string
    amount: string
    validFrom: string
    validTo?: string | null
  },
): PriceList {
  return {
    ...base,
    ...overrides,
    entries: [
      {
        id: 'e1',
        priceListId: base.id,
        variantId: overrides.variantId,
        amount: { currency: 'BRL', amount: overrides.amount },
        validFrom: overrides.validFrom,
        validTo: overrides.validTo ?? null,
      },
    ],
  }
}

describe('PriceResolutionPolicy', () => {
  const ids = (() => {
    let n = 0
    return () => `id-${++n}`
  })()

  it('classifies validity windows', () => {
    expect(
      PriceResolutionPolicy.classifyEntryValidity(
        '2026-01-01T00:00:00.000Z',
        null,
        '2026-06-01T00:00:00.000Z',
      ),
    ).toBe('unbounded')
    expect(
      PriceResolutionPolicy.classifyEntryValidity(
        '2026-01-01T00:00:00.000Z',
        '2026-12-01T00:00:00.000Z',
        '2026-06-01T00:00:00.000Z',
      ),
    ).toBe('current')
    expect(
      PriceResolutionPolicy.classifyEntryValidity(
        '2027-01-01T00:00:00.000Z',
        null,
        '2026-06-01T00:00:00.000Z',
      ),
    ).toBe('future')
    expect(
      PriceResolutionPolicy.classifyEntryValidity(
        '2026-01-01T00:00:00.000Z',
        '2026-02-01T00:00:00.000Z',
        '2026-06-01T00:00:00.000Z',
      ),
    ).toBe('expired')
  })

  it('ignores archived lists and expired entries', () => {
    const created = createDefaultPriceList('org', ids)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const active = listWithEntry(created.value.priceList, {
      variantId: 'v1',
      amount: '10',
      validFrom: '2026-01-01T00:00:00.000Z',
      validTo: '2026-02-01T00:00:00.000Z',
    })
    expect(
      PriceResolutionPolicy.resolve(
        active,
        'v1',
        '2026-06-01T00:00:00.000Z',
      ).ok,
    ).toBe(false)

    const archived = { ...active, status: 'archived' as const, validTo: null }
    archived.entries[0]!.validTo = null
    expect(
      PriceResolutionPolicy.resolve(
        archived,
        'v1',
        '2026-06-01T00:00:00.000Z',
      ).ok,
    ).toBe(false)
  })

  it('picks highest priority among active lists', () => {
    const created = createDefaultPriceList('org', ids)
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const low = listWithEntry(
      {
        ...created.value.priceList,
        id: 'low',
        isDefault: false,
        priority: 1,
      },
      {
        variantId: 'v1',
        amount: '10',
        validFrom: '2026-01-01T00:00:00.000Z',
      },
    )
    const high = listWithEntry(
      {
        ...created.value.priceList,
        id: 'high',
        isDefault: false,
        priority: 50,
        name: 'Promo',
      },
      {
        variantId: 'v1',
        amount: '8',
        validFrom: '2026-01-01T00:00:00.000Z',
      },
    )
    const resolved = PriceResolutionPolicy.resolveFromLists(
      [low, high],
      'v1',
      { at: '2026-06-01T00:00:00.000Z' },
    )
    expect(resolved.ok).toBe(true)
    if (!resolved.ok) return
    expect(resolved.value.priceListId).toBe('high')
    expect(resolved.value.amount.amount).toBe('8')
  })
})
