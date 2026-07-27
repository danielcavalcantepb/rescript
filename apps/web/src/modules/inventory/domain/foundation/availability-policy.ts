import {
  quantityAvailable,
  type InventoryAvailability,
  type InventoryContext,
  type InventoryItem,
  type InventoryVariantLookup,
  type StockLocation,
} from '#/modules/inventory/domain/foundation/types'

export type AvailabilityCheckInput = {
  location: StockLocation
  item: InventoryItem | null
  lookup: InventoryVariantLookup
  context?: InventoryContext
}

/**
 * Pure AvailabilityPolicy — never touches persistence.
 * Rules: location active, product/variant active, qty >= 0, reserved placeholder.
 */
export const AvailabilityPolicy = {
  check(input: AvailabilityCheckInput): InventoryAvailability {
    const { location, item, lookup, context } = input
    const locationId = context?.locationId ?? location.id

    if (lookup.organizationId !== location.organizationId) {
      return unavailable(
        lookup.variantId,
        locationId,
        'organization_mismatch',
      )
    }

    if (location.status !== 'active') {
      return unavailable(
        lookup.variantId,
        locationId,
        'location_not_active',
      )
    }

    if (lookup.productStatus === 'archived') {
      return unavailable(lookup.variantId, locationId, 'product_archived')
    }

    if (lookup.productStatus !== 'active') {
      return unavailable(lookup.variantId, locationId, 'product_not_active')
    }

    if (lookup.variantStatus === 'archived') {
      return unavailable(lookup.variantId, locationId, 'variant_archived')
    }

    if (lookup.variantStatus !== 'active') {
      return unavailable(lookup.variantId, locationId, 'variant_not_active')
    }

    if (context?.requireTracksInventory && !lookup.tracksInventory) {
      return unavailable(
        lookup.variantId,
        locationId,
        'variant_does_not_track_inventory',
      )
    }

    if (!item || item.status !== 'active') {
      return {
        variantId: lookup.variantId,
        locationId,
        available: false,
        quantityOnHand: 0,
        quantityReserved: 0,
        quantityAvailable: 0,
        reason: 'inventory_item_missing',
      }
    }

    if (item.locationId !== location.id || item.variantId !== lookup.variantId) {
      return unavailable(
        lookup.variantId,
        locationId,
        'inventory_item_mismatch',
      )
    }

    if (item.quantityOnHand < 0 || item.quantityReserved < 0) {
      return unavailable(lookup.variantId, locationId, 'invalid_quantity')
    }

    const availableQty = quantityAvailable(item)
    return {
      variantId: lookup.variantId,
      locationId,
      available: availableQty >= 0,
      quantityOnHand: item.quantityOnHand,
      quantityReserved: item.quantityReserved,
      quantityAvailable: availableQty,
      reason: null,
    }
  },
}

function unavailable(
  variantId: string,
  locationId: string,
  reason: string,
): InventoryAvailability {
  return {
    variantId,
    locationId,
    available: false,
    quantityOnHand: 0,
    quantityReserved: 0,
    quantityAvailable: 0,
    reason,
  }
}
