import { describe, expect, it } from 'vitest'
import {
  decodeListCursor,
  encodeListCursor,
  sanitizeSearchTerm,
} from '#/modules/products/infrastructure/supabase-product-repository'

describe('product repository helpers', () => {
  it('sanitizes PostgREST-breaking characters', () => {
    expect(sanitizeSearchTerm('Acme, Inc. (BR)')).toBe('Acme Inc BR')
    expect(sanitizeSearchTerm("O'Reilly %_")).toBe('O Reilly')
  })

  it('round-trips cursors with special characters in name', () => {
    const cursor = encodeListCursor('Acme | Filial', 'uuid-1')
    expect(decodeListCursor(cursor)).toEqual({
      value: 'Acme | Filial',
      id: 'uuid-1',
    })
  })

  it('returns null for malformed cursors', () => {
    expect(decodeListCursor('no-separator')).toBeNull()
  })
})
