import { describe, expect, it } from 'vitest'
import {
  SUPPLIER_LIMITS,
  isValidDocument,
  normalizeDocument,
  validateCreateSupplier,
  validateUpdateSupplier,
} from '#/modules/suppliers/domain/validation'

describe('supplier validation', () => {
  it('requires legalName', () => {
    const errors = validateCreateSupplier({
      legalName: '  ',
      personType: 'PF',
    })
    expect(errors.legalName).toBeTruthy()
  })

  it('accepts optional document for draft', () => {
    const errors = validateCreateSupplier({
      legalName: 'Fornecedor',
      personType: 'PF',
    })
    expect(errors).toEqual({})
  })

  it('requires document when activate', () => {
    const errors = validateCreateSupplier({
      legalName: 'Fornecedor',
      personType: 'PF',
      activate: true,
    })
    expect(errors.document).toBeTruthy()
  })

  it('validates CPF/CNPJ via shared rules', () => {
    expect(isValidDocument('52998224725', 'PF')).toBe(true)
    expect(isValidDocument('11444777000161', 'PJ')).toBe(true)
    expect(normalizeDocument('529.982.247-25')).toBe('52998224725')
  })

  it('enforces legalName length', () => {
    const errors = validateCreateSupplier({
      legalName: 'x'.repeat(SUPPLIER_LIMITS.legalName + 1),
      personType: 'PF',
    })
    expect(errors.legalName).toMatch(/máximo/)
  })

  it('update uses context personType for document', () => {
    const withoutContext = validateUpdateSupplier({
      document: '11444777000161',
    })
    expect(withoutContext.document).toBeTruthy()

    const withContext = validateUpdateSupplier(
      { document: '11444777000161' },
      { personType: 'PJ' },
    )
    expect(withContext).toEqual({})
  })
})
