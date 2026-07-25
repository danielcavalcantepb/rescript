import { describe, expect, it } from 'vitest'
import {
  PRODUCT_LIMITS,
  normalizeSku,
  validateCreateProduct,
  validateUpdateProduct,
} from '#/modules/products/domain/validation'

describe('product validation', () => {
  it('requires name, sku and unit', () => {
    const errors = validateCreateProduct({
      name: '  ',
      sku: '',
      unit: ' ',
    })
    expect(errors.name).toBeTruthy()
    expect(errors.sku).toBeTruthy()
    expect(errors.unit).toBeTruthy()
  })

  it('accepts valid create input', () => {
    const errors = validateCreateProduct({
      name: 'Parafuso',
      sku: 'par-01',
      unit: 'un',
      category: 'Ferragens',
    })
    expect(errors).toEqual({})
  })

  it('normalizes sku to uppercase trimmed', () => {
    expect(normalizeSku('  abc-1  ')).toBe('ABC-1')
  })

  it('enforces name length', () => {
    const errors = validateCreateProduct({
      name: 'x'.repeat(PRODUCT_LIMITS.name + 1),
      sku: 'SKU1',
      unit: 'un',
    })
    expect(errors.name).toMatch(/máximo/)
  })

  it('rejects empty strings on update', () => {
    expect(validateUpdateProduct({ name: '  ' }).name).toBeTruthy()
    expect(validateUpdateProduct({ sku: ' ' }).sku).toBeTruthy()
    expect(validateUpdateProduct({ unit: '' }).unit).toBeTruthy()
  })
})
