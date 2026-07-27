import { describe, expect, it } from 'vitest'
import {
  calculateLineTotals,
  calculatePurchaseTotals,
} from '#/modules/purchase/domain/totals'
import type { PurchaseItem } from '#/modules/purchase/domain/types'

function item(partial: Partial<PurchaseItem> & Pick<PurchaseItem, 'id'>): PurchaseItem {
  return {
    organizationId: 'org',
    purchaseOrderId: 'po',
    variantId: 'v',
    variantSku: 'SKU',
    variantName: 'Item',
    unitCode: 'UN',
    description: null,
    quantity: '2',
    receivedQuantity: '0.0000',
    pendingQuantity: '2.0000',
    unitPrice: '10',
    currency: 'BRL',
    discount: '0',
    subtotal: '20',
    total: '20',
    priceListId: null,
    priceSource: 'manual',
    sortOrder: 0,
    status: 'active',
    removedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('purchase totals domain service', () => {
  it('calculates line subtotal and total with discount', () => {
    expect(
      calculateLineTotals({ quantity: '3', unitPrice: '10.5', discount: '1.5' }),
    ).toEqual({ subtotal: '31.5000', total: '30.0000' })
  })

  it('aggregates only active items', () => {
    const totals = calculatePurchaseTotals(
      [
        item({ id: '1', subtotal: '20', discount: '2', total: '18' }),
        item({
          id: '2',
          status: 'removed',
          subtotal: '100',
          discount: '0',
          total: '100',
        }),
        item({ id: '3', subtotal: '5', discount: '1', total: '4' }),
      ],
      'BRL',
    )
    expect(totals).toEqual({
      currency: 'BRL',
      subtotal: '25.0000',
      discountTotal: '3.0000',
      grandTotal: '22.0000',
    })
  })
})
