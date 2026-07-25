import { describe, expect, it } from 'vitest'
import {
  ProductConflictError,
  ProductValidationError,
} from '#/modules/products/application/errors'
import { toFormError } from '#/modules/products/ui/use-product-actions'

describe('toFormError', () => {
  it('maps validation to field errors', () => {
    const mapped = toFormError(
      new ProductValidationError({ name: 'Informe o nome do produto.' }),
    )
    expect(mapped.formError).toBeNull()
    expect(mapped.fieldErrors.name).toBeTruthy()
  })

  it('maps sku conflict to sku field', () => {
    const mapped = toFormError(
      new ProductConflictError(
        'Já existe um produto com este SKU nesta organização.',
      ),
    )
    expect(mapped.fieldErrors.sku).toMatch(/SKU/)
  })
})
