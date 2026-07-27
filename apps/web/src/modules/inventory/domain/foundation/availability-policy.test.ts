import { describe, expect, it } from 'vitest'
import { AvailabilityPolicy } from '#/modules/inventory/domain/foundation/availability-policy'
import type {
  InventoryItem,
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

const item = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  id: 'item-1',
  organizationId: 'org-1',
  locationId: 'loc-1',
  variantId: 'var-1',
  quantityOnHand: 10,
  quantityReserved: 0,
  status: 'active',
  ...overrides,
})

describe('AvailabilityPolicy', () => {
  it('returns available when location/product/variant active and qty >= 0', () => {
    const result = AvailabilityPolicy.check({
      location: location(),
      item: item({ quantityOnHand: 5, quantityReserved: 2 }),
      lookup: lookup(),
    })
    expect(result.available).toBe(true)
    expect(result.quantityAvailable).toBe(3)
    expect(result.reason).toBeNull()
  })

  it('rejects inactive / archived location', () => {
    expect(
      AvailabilityPolicy.check({
        location: location({ status: 'inactive' }),
        item: item(),
        lookup: lookup(),
      }).reason,
    ).toBe('location_not_active')
    expect(
      AvailabilityPolicy.check({
        location: location({ status: 'archived' }),
        item: item(),
        lookup: lookup(),
      }).reason,
    ).toBe('location_not_active')
  })

  it('rejects archived product and variant', () => {
    expect(
      AvailabilityPolicy.check({
        location: location(),
        item: item(),
        lookup: lookup({ productStatus: 'archived' }),
      }).reason,
    ).toBe('product_archived')
    expect(
      AvailabilityPolicy.check({
        location: location(),
        item: item(),
        lookup: lookup({ variantStatus: 'archived' }),
      }).reason,
    ).toBe('variant_archived')
  })

  it('rejects draft product/variant', () => {
    expect(
      AvailabilityPolicy.check({
        location: location(),
        item: item(),
        lookup: lookup({ productStatus: 'draft' }),
      }).reason,
    ).toBe('product_not_active')
    expect(
      AvailabilityPolicy.check({
        location: location(),
        item: item(),
        lookup: lookup({ variantStatus: 'draft' }),
      }).reason,
    ).toBe('variant_not_active')
  })

  it('treats missing item as unavailable with zero quantities', () => {
    const result = AvailabilityPolicy.check({
      location: location(),
      item: null,
      lookup: lookup(),
    })
    expect(result.available).toBe(false)
    expect(result.quantityOnHand).toBe(0)
    expect(result.reason).toBe('inventory_item_missing')
  })

  it('honors requireTracksInventory', () => {
    expect(
      AvailabilityPolicy.check({
        location: location(),
        item: item(),
        lookup: lookup({ tracksInventory: false }),
        context: { requireTracksInventory: true },
      }).reason,
    ).toBe('variant_does_not_track_inventory')
  })
})
