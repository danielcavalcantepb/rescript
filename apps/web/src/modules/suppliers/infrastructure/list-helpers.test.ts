import { describe, expect, it } from 'vitest'
import {
  decodeListCursor,
  encodeListCursor,
  sanitizeSearchTerm,
} from '#/modules/suppliers/infrastructure/list-helpers'

describe('supplier list helpers', () => {
  it('sanitizes PostgREST-breaking chars', () => {
    expect(sanitizeSearchTerm(`a,b(c)%_"x"`)).toBe('a b c x')
  })

  it('roundtrips cursors', () => {
    const encoded = encodeListCursor('Ada', 'id-1')
    expect(decodeListCursor(encoded)).toEqual({ value: 'Ada', id: 'id-1' })
  })
})
