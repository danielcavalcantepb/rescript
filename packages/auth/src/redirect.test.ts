import { describe, expect, it } from 'vitest'
import { sanitizeRedirectPath } from './redirect'

describe('sanitizeRedirectPath', () => {
  it('allows safe relative paths', () => {
    expect(sanitizeRedirectPath('/clientes')).toBe('/clientes')
    expect(sanitizeRedirectPath('/vendas/sale_1')).toBe('/vendas/sale_1')
  })

  it('blocks open redirects', () => {
    expect(sanitizeRedirectPath('https://evil.com')).toBe('/')
    expect(sanitizeRedirectPath('//evil.com')).toBe('/')
    expect(sanitizeRedirectPath('\\evil')).toBe('/')
  })

  it('blocks login loops and invalid values', () => {
    expect(sanitizeRedirectPath('/login')).toBe('/')
    expect(sanitizeRedirectPath(undefined)).toBe('/')
    expect(sanitizeRedirectPath(123)).toBe('/')
  })
})
