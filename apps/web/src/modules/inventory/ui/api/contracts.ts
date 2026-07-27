import type {
  CreateInventoryItemCommand,
  CreateLocationCommand,
  GetAvailabilityQuery,
  InventoryAvailabilityResponse,
  InventoryItemResponse,
  InventoryVariantLookupResponse,
  LocationIdCommand,
  StockLocationResponse,
  UpdateInventoryItemCommand,
  UpdateLocationCommand,
  VariantInventorySummaryResponse,
} from '#/modules/inventory/application/foundation/dto'

export type InventoryOrgScope = {
  /** Membership selection claim only — server pins tenant after JWT check. */
  organizationId: string
}

export type InventoryRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string> } }

export type ListLocationsResponse = StockLocationResponse[]
export type GetLocationInput = InventoryOrgScope & { locationId: string }
export type CreateLocationInput = InventoryOrgScope & {
  command: CreateLocationCommand
}
export type UpdateLocationInput = InventoryOrgScope & {
  command: UpdateLocationCommand
}
export type LocationLifecycleInput = InventoryOrgScope & {
  command: LocationIdCommand
}

export type ListInventoryItemsInput = InventoryOrgScope & {
  query?: { variantId?: string; locationId?: string }
}
export type GetInventoryItemInput = InventoryOrgScope & {
  inventoryItemId: string
}
export type CreateInventoryItemInput = InventoryOrgScope & {
  command: CreateInventoryItemCommand
}
export type UpdateInventoryItemInput = InventoryOrgScope & {
  command: UpdateInventoryItemCommand
}
export type GetAvailabilityInput = InventoryOrgScope & GetAvailabilityQuery
export type VariantInventorySummaryInput = InventoryOrgScope & {
  variantId: string
}
export type LookupVariantInput = InventoryOrgScope & { variantId: string }

export type {
  StockLocationResponse,
  InventoryItemResponse,
  InventoryAvailabilityResponse,
  InventoryVariantLookupResponse,
  VariantInventorySummaryResponse,
  CreateLocationCommand,
  UpdateLocationCommand,
  CreateInventoryItemCommand,
  UpdateInventoryItemCommand,
}
