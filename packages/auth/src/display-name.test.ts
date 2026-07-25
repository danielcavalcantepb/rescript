import { describe, expect, it } from 'vitest'
import { getAuthDisplayName } from './display-name'

describe('getAuthDisplayName', () => {
  it('prefers metadata name', () => {
    expect(
      getAuthDisplayName({
        email: 'ana@example.com',
        userMetadata: { full_name: 'Ana Ribeiro' },
      }),
    ).toBe('Ana Ribeiro')
  })

  it('falls back to email', () => {
    expect(
      getAuthDisplayName({
        email: 'ana@example.com',
        userMetadata: {},
      }),
    ).toBe('ana@example.com')
  })
})
