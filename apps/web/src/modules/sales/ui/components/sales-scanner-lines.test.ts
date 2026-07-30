import { describe, expect, it } from 'vitest'
import {
  addScannedVariantToLines,
  emptyScannableLine,
} from './sales-scanner-lines'

const variant = {
  variantId: 'variant-1', productId: 'product-1', productName: 'Calça Comfort', variantSku: 'CAL-PP', brandId: null, categoryId: null, status: 'active',
}

describe('addScannedVariantToLines', () => {
  it('fills an empty order line with the scanned variant', () => {
    const result = addScannedVariantToLines([emptyScannableLine()], variant)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ variantId: 'variant-1', quantity: '1' })
  })

  it('increments a matching variant instead of creating a duplicate line', () => {
    const result = addScannedVariantToLines(
      [{ ...emptyScannableLine(), variantId: 'variant-1', quantity: '2' }],
      variant,
    )
    expect(result).toHaveLength(1)
    expect(result[0]?.quantity).toBe('3')
  })
})
