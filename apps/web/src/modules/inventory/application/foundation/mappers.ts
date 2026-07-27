import type {
  InventoryAvailabilityResponse,
  InventoryItemResponse,
  InventoryVariantLookupResponse,
  StockLocationResponse,
} from '#/modules/inventory/application/foundation/dto'
import type {
  InventoryAvailability,
  InventoryItem,
  InventoryVariantLookup,
  StockLocation,
} from '#/modules/inventory/domain/foundation/types'
import { quantityAvailable } from '#/modules/inventory/domain/foundation/types'

export function toStockLocationResponse(
  location: StockLocation,
): StockLocationResponse {
  return {
    id: location.id,
    organizationId: location.organizationId,
    code: location.code,
    name: location.name,
    description: location.description,
    isDefault: location.isDefault,
    priority: location.priority,
    status: location.status,
  }
}

export function toInventoryItemResponse(
  item: InventoryItem,
): InventoryItemResponse {
  return {
    id: item.id,
    organizationId: item.organizationId,
    locationId: item.locationId,
    variantId: item.variantId,
    quantityOnHand: item.quantityOnHand,
    quantityReserved: item.quantityReserved,
    quantityAvailable: quantityAvailable(item),
    status: item.status,
  }
}

export function toAvailabilityResponse(
  availability: InventoryAvailability,
): InventoryAvailabilityResponse {
  return { ...availability }
}

export function toLookupResponse(
  lookup: InventoryVariantLookup,
): InventoryVariantLookupResponse {
  return { ...lookup }
}
