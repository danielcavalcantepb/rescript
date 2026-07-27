import { describe, expect, it } from 'vitest'
import { initials } from '#/lib/format'

describe('initials', () => {
  it('uses first letters of a full name', () => {
    expect(initials('Daniel Cavalcante')).toBe('DC')
  })

  it('uses a single initial for a single given name', () => {
    expect(initials('João')).toBe('J')
  })

  it('never derives two letters from an email local-part style string', () => {
    // Guard: if a bad caller still passes local-part, do not invent "DA"
    expect(initials('danielsalesempreendedor')).toBe('D')
  })

  it('uses U for the neutral Usuário fallback', () => {
    expect(initials('Usuário')).toBe('U')
  })
})
