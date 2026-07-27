import { describe, expect, it } from 'vitest'
import {
  buildAuthNameMetadata,
  hasResolvedUserName,
  resolveUserDisplayName,
  resolveUserFirstName,
  USER_NAME_FALLBACK,
} from './display-name'

describe('resolveUserDisplayName', () => {
  it('prefers public profile full_name over metadata', () => {
    expect(
      resolveUserDisplayName({
        email: 'ana@example.com',
        profileFullName: 'Ana Perfil',
        userMetadata: { full_name: 'Ana Meta' },
      }),
    ).toBe('Ana Perfil')
  })

  it('uses full_name before display_name', () => {
    expect(
      resolveUserDisplayName({
        email: 'ana@example.com',
        userMetadata: {
          full_name: 'Ana Ribeiro',
          display_name: 'Ana R.',
        },
      }),
    ).toBe('Ana Ribeiro')
  })

  it('falls through display_name → name → first_name', () => {
    expect(
      resolveUserDisplayName({
        userMetadata: { display_name: 'Display Only' },
      }),
    ).toBe('Display Only')

    expect(
      resolveUserDisplayName({
        userMetadata: { name: 'Name Only' },
      }),
    ).toBe('Name Only')

    expect(
      resolveUserDisplayName({
        userMetadata: { first_name: 'First Only' },
      }),
    ).toBe('First Only')
  })

  it('never uses email or local-part as a human name', () => {
    expect(
      resolveUserDisplayName({
        email: 'danielsalesempreendedor@gmail.com',
        userMetadata: {},
      }),
    ).toBe(USER_NAME_FALLBACK)

    expect(
      resolveUserDisplayName({
        email: 'danielsalesempreendedor@gmail.com',
        userMetadata: null,
      }),
    ).toBe(USER_NAME_FALLBACK)
  })

  it('returns Usuário when nothing is available', () => {
    expect(resolveUserDisplayName({ email: null, userMetadata: {} })).toBe(
      USER_NAME_FALLBACK,
    )
  })
})

describe('resolveUserFirstName', () => {
  it('uses first_name metadata when present', () => {
    expect(
      resolveUserFirstName({
        userMetadata: {
          first_name: 'Daniel',
          full_name: 'Daniel Cavalcante',
        },
      }),
    ).toBe('Daniel')
  })

  it('takes the first token of a full name', () => {
    expect(
      resolveUserFirstName({
        userMetadata: { full_name: 'Daniel Cavalcante' },
      }),
    ).toBe('Daniel')
  })

  it('handles compound names', () => {
    expect(
      resolveUserFirstName({
        userMetadata: { full_name: 'Maria de Fátima Silva' },
      }),
    ).toBe('Maria')
  })

  it('handles a single given name', () => {
    expect(
      resolveUserFirstName({
        userMetadata: { full_name: 'João' },
      }),
    ).toBe('João')
  })

  it('never greets with email local-part', () => {
    expect(
      resolveUserFirstName({
        email: 'danielsalesempreendedor@gmail.com',
        userMetadata: {},
      }),
    ).toBe(USER_NAME_FALLBACK)
  })
})

describe('hasResolvedUserName / buildAuthNameMetadata', () => {
  it('detects missing human name', () => {
    expect(
      hasResolvedUserName({
        email: 'x@y.com',
        userMetadata: {},
      }),
    ).toBe(false)

    expect(
      hasResolvedUserName({
        userMetadata: { full_name: 'Daniel Cavalcante' },
      }),
    ).toBe(true)
  })

  it('builds invite/update metadata without inventing from email', () => {
    expect(buildAuthNameMetadata('Daniel Cavalcante')).toEqual({
      full_name: 'Daniel Cavalcante',
      display_name: 'Daniel Cavalcante',
    })
    expect(() => buildAuthNameMetadata(' ')).toThrow('invalid_full_name')
  })
})
