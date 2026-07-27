import type {
  InventoryItem,
  InventoryVariantLookup,
  StockLocation,
  VariantId,
} from '#/modules/inventory/domain/foundation/types'

export type StockLocationRepository = {
  getById(
    organizationId: string,
    locationId: string,
  ): Promise<StockLocation | null>
  getDefault(organizationId: string): Promise<StockLocation | null>
  listByOrganization(organizationId: string): Promise<StockLocation[]>
  save(location: StockLocation): Promise<void>
}

export type InventoryItemRepository = {
  getById(
    organizationId: string,
    inventoryItemId: string,
  ): Promise<InventoryItem | null>
  getByVariantAndLocation(
    organizationId: string,
    variantId: string,
    locationId: string,
  ): Promise<InventoryItem | null>
  listByOrganization(
    organizationId: string,
    query?: { variantId?: string; locationId?: string; status?: string },
  ): Promise<InventoryItem[]>
  save(item: InventoryItem): Promise<void>
}

export type InventoryHistoryRecord = {
  id: string
  organizationId: string
  inventoryItemId: string
  locationId: string
  variantId: string
  fieldName: string
  previousValue: string | null
  newValue: string
  reason: string | null
  recordedAt: string
  recordedBy: string
}

export type InventoryHistoryPort = {
  append(record: Omit<InventoryHistoryRecord, 'id' | 'recordedAt'> & {
    id?: string
    recordedAt?: string
  }): Promise<void>
  listByOrganization(
    organizationId: string,
    query?: { inventoryItemId?: string; variantId?: string; limit?: number },
  ): Promise<InventoryHistoryRecord[]>
}

/**
 * Operational Catalog lookup — no Product aggregate reconstruction.
 */
export type InventoryVariantLookupPort = {
  lookupVariant(variantId: VariantId): Promise<InventoryVariantLookup | null>
  lookupVariants(
    variantIds: VariantId[],
  ): Promise<InventoryVariantLookup[]>
}

export type IdGeneratorPort = { next: () => string }
export type ClockPort = { nowIso: () => string }

export function createInMemoryInventoryHistory(): InventoryHistoryPort {
  const rows: InventoryHistoryRecord[] = []
  return {
    async append(record) {
      rows.push({
        id: record.id ?? crypto.randomUUID(),
        organizationId: record.organizationId,
        inventoryItemId: record.inventoryItemId,
        locationId: record.locationId,
        variantId: record.variantId,
        fieldName: record.fieldName,
        previousValue: record.previousValue,
        newValue: record.newValue,
        reason: record.reason,
        recordedAt: record.recordedAt ?? new Date().toISOString(),
        recordedBy: record.recordedBy,
      })
    },
    async listByOrganization(organizationId, query) {
      return rows
        .filter((r) => r.organizationId === organizationId)
        .filter((r) =>
          query?.inventoryItemId
            ? r.inventoryItemId === query.inventoryItemId
            : true,
        )
        .filter((r) =>
          query?.variantId ? r.variantId === query.variantId : true,
        )
        .slice(0, query?.limit ?? 50)
    },
  }
}
