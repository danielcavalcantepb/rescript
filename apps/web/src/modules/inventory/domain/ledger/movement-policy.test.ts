import { describe, expect, it } from 'vitest'
import { MovementPolicy } from '#/modules/inventory/domain/ledger/movement-policy'
import type {
  InventoryVariantLookup,
  StockLocation,
} from '#/modules/inventory/domain/foundation/types'

const location = (overrides: Partial<StockLocation> = {}): StockLocation => ({
  id: 'loc-1',
  organizationId: 'org-1',
  code: 'MAIN',
  name: 'Principal',
  description: null,
  isDefault: true,
  priority: 100,
  status: 'active',
  ...overrides,
})

const lookup = (
  overrides: Partial<InventoryVariantLookup> = {},
): InventoryVariantLookup => ({
  variantId: 'var-1',
  productId: 'prod-1',
  organizationId: 'org-1',
  variantStatus: 'active',
  productStatus: 'active',
  unitOfMeasureId: 'uom-1',
  sku: 'SKU-1',
  tracksInventory: true,
  ...overrides,
})

describe('MovementPolicy', () => {
  it('accepts entry and computes after quantity', () => {
    const result = MovementPolicy.validate({
      type: 'entry',
      quantity: 5,
      reason: 'compra',
      location: location(),
      lookup: lookup(),
      currentOnHand: 2,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.signedDelta).toBe(5)
      expect(result.afterQuantity).toBe(7)
    }
  })

  it('rejects exit when stock insufficient', () => {
    const result = MovementPolicy.validate({
      type: 'exit',
      quantity: 3,
      reason: 'venda',
      location: location(),
      lookup: lookup(),
      currentOnHand: 2,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('insufficient_stock')
  })

  it('rejects inactive location / archived product', () => {
    expect(
      MovementPolicy.validate({
        type: 'entry',
        quantity: 1,
        reason: 'x',
        location: location({ status: 'inactive' }),
        lookup: lookup(),
        currentOnHand: 0,
      }).ok,
    ).toBe(false)
    expect(
      MovementPolicy.validate({
        type: 'entry',
        quantity: 1,
        reason: 'x',
        location: location(),
        lookup: lookup({ productStatus: 'archived' }),
        currentOnHand: 0,
      }).ok,
    ).toBe(false)
  })

  it('validates transfer destination when provided', () => {
    const bad = MovementPolicy.validate({
      type: 'transfer_out',
      quantity: 1,
      reason: 'xfer',
      location: location(),
      lookup: lookup(),
      currentOnHand: 5,
      toLocation: location({ id: 'loc-1' }),
    })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.code).toBe('transfer_same_location')

    const ok = MovementPolicy.validate({
      type: 'transfer_out',
      quantity: 1,
      reason: 'xfer',
      location: location(),
      lookup: lookup(),
      currentOnHand: 5,
      toLocation: location({ id: 'loc-2', code: 'B', isDefault: false }),
    })
    expect(ok.ok).toBe(true)
  })

  it('reversal uses negated signed delta', () => {
    const result = MovementPolicy.validate({
      type: 'reversal',
      quantity: 4,
      reason: 'estorno',
      location: location(),
      lookup: lookup(),
      currentOnHand: 10,
      reversesSignedDelta: 4,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.signedDelta).toBe(-4)
      expect(result.afterQuantity).toBe(6)
    }
  })
})
