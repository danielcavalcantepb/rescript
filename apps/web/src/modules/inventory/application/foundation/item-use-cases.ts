import type {
  CreateInventoryItemCommand,
  GetAvailabilityQuery,
  InventoryAvailabilityResponse,
  InventoryItemResponse,
  UpdateInventoryItemCommand,
  VariantInventorySummaryResponse,
} from '#/modules/inventory/application/foundation/dto'
import {
  requireInventoryCreate,
  requireInventoryEdit,
  requireInventoryRead,
  type InventoryFoundationDeps,
} from '#/modules/inventory/application/foundation/deps'
import {
  InventoryFoundationConflictError,
  InventoryFoundationNotFoundError,
  InventoryFoundationPermissionError,
} from '#/modules/inventory/application/foundation/errors'
import {
  toAvailabilityResponse,
  toInventoryItemResponse,
  toLookupResponse,
  toStockLocationResponse,
} from '#/modules/inventory/application/foundation/mappers'
import { AvailabilityPolicy } from '#/modules/inventory/domain/foundation/availability-policy'
import { createInventoryItem as buildInventoryItem } from '#/modules/inventory/domain/foundation/factories'

async function resolveLookup(
  deps: InventoryFoundationDeps,
  variantId: string,
) {
  const lookup = await deps.variantLookup.lookupVariant(variantId)
  if (!lookup || lookup.organizationId !== deps.organizationId) {
    throw new InventoryFoundationNotFoundError('variant_not_found')
  }
  return lookup
}

export async function listInventoryItems(
  deps: InventoryFoundationDeps,
  query?: { variantId?: string; locationId?: string },
): Promise<InventoryItemResponse[]> {
  if (!requireInventoryRead(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const items = await deps.items.listByOrganization(deps.organizationId, query)
  return items.map(toInventoryItemResponse)
}

export async function getInventoryItem(
  deps: InventoryFoundationDeps,
  inventoryItemId: string,
): Promise<InventoryItemResponse> {
  if (!requireInventoryRead(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const item = await deps.items.getById(deps.organizationId, inventoryItemId)
  if (!item) {
    throw new InventoryFoundationNotFoundError('inventory_item_not_found')
  }
  return toInventoryItemResponse(item)
}

export async function createInventoryItem(
  deps: InventoryFoundationDeps,
  command: CreateInventoryItemCommand,
): Promise<InventoryItemResponse> {
  if (!requireInventoryCreate(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  // Ledger is SoT — identity rows always start at 0. Opening stock = entry movement.
  if (command.quantityOnHand !== undefined && command.quantityOnHand !== 0) {
    throw new InventoryFoundationConflictError(
      'quantity_via_ledger_only',
    )
  }
  const lookup = await resolveLookup(deps, command.variantId)
  if (lookup.productStatus === 'archived' || lookup.variantStatus === 'archived') {
    throw new InventoryFoundationConflictError('catalog_entity_archived')
  }

  const location = await deps.locations.getById(
    deps.organizationId,
    command.locationId,
  )
  if (!location) {
    throw new InventoryFoundationNotFoundError('location_not_found')
  }
  if (location.status === 'archived') {
    throw new InventoryFoundationConflictError('location_archived')
  }

  const existing = await deps.items.getByVariantAndLocation(
    deps.organizationId,
    command.variantId,
    command.locationId,
  )
  if (existing) {
    throw new InventoryFoundationConflictError('inventory_item_exists')
  }

  const item = buildInventoryItem({
    id: deps.ids.next(),
    organizationId: deps.organizationId,
    locationId: command.locationId,
    variantId: command.variantId,
    quantityOnHand: 0,
  })
  await deps.items.save(item)
  await deps.history.append({
    organizationId: deps.organizationId,
    inventoryItemId: item.id,
    locationId: item.locationId,
    variantId: item.variantId,
    fieldName: 'created',
    previousValue: null,
    newValue: '0',
    reason: command.reason ?? null,
    recordedBy: deps.userId,
    recordedAt: deps.clock.nowIso(),
  })
  deps.events.append([
    {
      type: 'InventoryItemCreated',
      organizationId: deps.organizationId,
      inventoryItemId: item.id,
      variantId: item.variantId,
      locationId: item.locationId,
    },
  ])
  return toInventoryItemResponse(item)
}

/**
 * Metadata-only. Quantity changes must go through the ledger.
 */
export async function updateInventoryItem(
  deps: InventoryFoundationDeps,
  command: UpdateInventoryItemCommand,
): Promise<InventoryItemResponse> {
  if (!requireInventoryEdit(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  if (command.quantityOnHand !== undefined) {
    throw new InventoryFoundationConflictError('quantity_via_ledger_only')
  }
  const current = await deps.items.getById(
    deps.organizationId,
    command.inventoryItemId,
  )
  if (!current) {
    throw new InventoryFoundationNotFoundError('inventory_item_not_found')
  }
  if (current.status === 'archived') {
    throw new InventoryFoundationConflictError('inventory_item_archived')
  }
  return toInventoryItemResponse(current)
}

export async function getAvailability(
  deps: InventoryFoundationDeps,
  query: GetAvailabilityQuery,
): Promise<InventoryAvailabilityResponse> {
  if (!requireInventoryRead(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const lookup = await resolveLookup(deps, query.variantId)
  const location = query.locationId
    ? await deps.locations.getById(deps.organizationId, query.locationId)
    : await deps.locations.getDefault(deps.organizationId)
  if (!location) {
    throw new InventoryFoundationNotFoundError('location_not_found')
  }
  const item = await deps.items.getByVariantAndLocation(
    deps.organizationId,
    query.variantId,
    location.id,
  )
  const availability = AvailabilityPolicy.check({
    location,
    item,
    lookup,
    context: {
      locationId: location.id,
      requireTracksInventory: true,
    },
  })
  deps.events.append([
    {
      type: 'InventoryAvailabilityChecked',
      organizationId: deps.organizationId,
      variantId: query.variantId,
      locationId: location.id,
      available: availability.available,
    },
  ])
  return toAvailabilityResponse(availability)
}

export async function getVariantInventorySummary(
  deps: InventoryFoundationDeps,
  variantId: string,
): Promise<VariantInventorySummaryResponse> {
  if (!requireInventoryRead(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const lookup = await resolveLookup(deps, variantId)
  const defaultLocation = await deps.locations.getDefault(deps.organizationId)
  if (!defaultLocation) {
    return {
      variantId,
      productId: lookup.productId,
      defaultLocation: null,
      item: null,
      availability: null,
    }
  }
  const item = await deps.items.getByVariantAndLocation(
    deps.organizationId,
    variantId,
    defaultLocation.id,
  )
  const availability = AvailabilityPolicy.check({
    location: defaultLocation,
    item,
    lookup,
    context: { locationId: defaultLocation.id },
  })
  return {
    variantId,
    productId: lookup.productId,
    defaultLocation: toStockLocationResponse(defaultLocation),
    item: item ? toInventoryItemResponse(item) : null,
    availability: toAvailabilityResponse(availability),
  }
}

export async function lookupVariantOperational(
  deps: InventoryFoundationDeps,
  variantId: string,
) {
  if (!requireInventoryRead(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const lookup = await resolveLookup(deps, variantId)
  return toLookupResponse(lookup)
}
