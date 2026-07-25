import { describe, expect, it } from 'vitest'
import {
  CUSTOMER_LIMITS,
  isValidDocument,
  normalizeDocument,
  validateCreateCustomer,
  validateUpdateCustomer,
} from '#/modules/customers/domain/validation'

describe('customer validation', () => {
  it('requires name', () => {
    const errors = validateCreateCustomer({
      name: '  ',
      personType: 'PF',
    })
    expect(errors.name).toBeTruthy()
  })

  it('accepts optional document', () => {
    const errors = validateCreateCustomer({
      name: 'Maria',
      personType: 'PF',
    })
    expect(errors).toEqual({})
  })

  it('validates CPF checksum', () => {
    expect(isValidDocument('52998224725', 'PF')).toBe(true)
    expect(isValidDocument('11111111111', 'PF')).toBe(false)
  })

  it('validates CNPJ checksum', () => {
    expect(isValidDocument('11222333000181', 'PJ')).toBe(true)
    expect(isValidDocument('11222333000180', 'PJ')).toBe(false)
  })

  it('normalizes document digits', () => {
    expect(normalizeDocument('529.982.247-25')).toBe('52998224725')
  })

  it('rejects invalid email', () => {
    const errors = validateCreateCustomer({
      name: 'Acme',
      personType: 'PJ',
      email: 'not-an-email',
    })
    expect(errors.email).toBeTruthy()
  })

  it('enforces name length', () => {
    const errors = validateCreateCustomer({
      name: 'x'.repeat(CUSTOMER_LIMITS.name + 1),
      personType: 'PF',
    })
    expect(errors.name).toMatch(/máximo/)
  })

  it('update uses context personType for document', () => {
    const withoutContext = validateUpdateCustomer({
      document: '11222333000181',
    })
    expect(withoutContext.document).toBeTruthy()

    const withContext = validateUpdateCustomer(
      { document: '11222333000181' },
      { personType: 'PJ' },
    )
    expect(withContext).toEqual({})
  })

  it('update rejects empty name when provided', () => {
    const errors = validateUpdateCustomer({ name: '  ' })
    expect(errors.name).toBeTruthy()
  })
})
