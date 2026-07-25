import { describe, expect, it } from 'vitest'
import { mapAuthError } from './errors'

describe('mapAuthError', () => {
  it('maps invalid credentials without revealing enumeration', () => {
    expect(mapAuthError({ message: 'Invalid login credentials' })).toBe(
      'E-mail ou senha incorretos.',
    )
    expect(mapAuthError({ message: 'User not found' })).toBe(
      'E-mail ou senha incorretos.',
    )
  })

  it('maps network failures to a generic retry message', () => {
    expect(mapAuthError({ message: 'Network request failed' })).toBe(
      'Não foi possível entrar agora. Tente novamente.',
    )
  })

  it('handles empty errors safely', () => {
    expect(mapAuthError(null)).toBe(
      'Não foi possível entrar agora. Tente novamente.',
    )
  })
})
