import { describe, expect, it } from 'vitest'
import {
  CUSTOMER_LIMITS,
  isValidDocument,
  normalizeDocument,
  validateCreateCustomer,
  validateUpdateCustomer,
} from '#/modules/customers/domain/validation'

describe('customer validation', () => {
  it('requires legalName', () => {
    const errors = validateCreateCustomer({
      legalName: '  ',
      personType: 'PF',
    })
    expect(errors.legalName).toBeTruthy()
  })

  it('accepts optional document for draft', () => {
    const errors = validateCreateCustomer({
      legalName: 'Maria',
      personType: 'PF',
    })
    expect(errors).toEqual({})
  })

  it('requires document when activate', () => {
    const errors = validateCreateCustomer({
      legalName: 'Maria',
      personType: 'PF',
      activate: true,
    })
    expect(errors.document).toBeTruthy()
  })

  it('validates CPF checksum', () => {
    expect(isValidDocument('52998224725', 'PF')).toBe(true)
    expect(isValidDocument('11111111111', 'PF')).toBe(false)
  })

  it('validates CNPJ checksum', () => {
    expect(isValidDocument('11444777000161', 'PJ')).toBe(true)
    expect(isValidDocument('11444777000160', 'PJ')).toBe(false)
  })

  it('normalizes document digits', () => {
    expect(normalizeDocument('529.982.247-25')).toBe('52998224725')
  })

  it('rejects invalid email', () => {
    const errors = validateCreateCustomer({
      legalName: 'Acme',
      personType: 'PJ',
      email: 'not-an-email',
    })
    expect(errors.email).toBeTruthy()
  })

  it('enforces legalName length', () => {
    const errors = validateCreateCustomer({
      legalName: 'x'.repeat(CUSTOMER_LIMITS.legalName + 1),
      personType: 'PF',
    })
    expect(errors.legalName).toMatch(/máximo/)
  })

  it('update uses context personType for document', () => {
    const withoutContext = validateUpdateCustomer({
      document: '11444777000161',
    })
    expect(withoutContext.document).toBeTruthy()

    const withContext = validateUpdateCustomer(
      { document: '11444777000161' },
      { personType: 'PJ' },
    )
    expect(withContext).toEqual({})
  })

  it('update rejects empty legalName when provided', () => {
    const errors = validateUpdateCustomer({ legalName: '  ' })
    expect(errors.legalName).toBeTruthy()
  })
})
