import { describe, expect, it } from 'vitest'
import { movementDelta, stockStatus } from '#/modules/inventory/domain/balance'
import {
  decodeListCursor,
  encodeListCursor,
  sanitizeSearchTerm,
} from '#/modules/inventory/infrastructure/list-helpers'
import { coerceQuantity } from '#/modules/inventory/infrastructure/mappers'

describe('inventory repository helpers', () => {
  it('sanitizes PostgREST-breaking characters', () => {
    expect(sanitizeSearchTerm('Acme, Inc. (BR)')).toBe('Acme Inc BR')
    expect(sanitizeSearchTerm("O'Reilly %_")).toBe('O Reilly')
  })

  it('round-trips cursors', () => {
    const cursor = encodeListCursor('2026-01-01T00:00:00.000Z', 'uuid-1')
    expect(decodeListCursor(cursor)).toEqual({
      value: '2026-01-01T00:00:00.000Z',
      id: 'uuid-1',
    })
  })

  it('returns null for malformed cursors', () => {
    expect(decodeListCursor('no-separator')).toBeNull()
  })

  it('coerces numeric strings from DB', () => {
    expect(coerceQuantity('12.5')).toBe(12.5)
    expect(coerceQuantity(3)).toBe(3)
    expect(coerceQuantity('')).toBe(0)
  })

  it('exposes official delta and stockStatus', () => {
    expect(movementDelta('exit', 4)).toBe(-4)
    expect(stockStatus(0)).toBe('out_of_stock')
    expect(stockStatus(1)).toBe('available')
  })
})
