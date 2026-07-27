import type {
  InventoryItem,
  StockLocation,
  StockLocationStatus,
  InventoryItemStatus,
} from '#/modules/inventory/domain/foundation/types'
import type { Database } from '@rescript/database'

type StockLocationRow = Database['public']['Tables']['stock_location']['Row']
type InventoryItemRow = Database['public']['Tables']['inventory_item']['Row']

export function mapStockLocation(row: StockLocationRow): StockLocation {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    description: row.description,
    isDefault: row.is_default,
    priority: row.priority,
    status: row.status as StockLocationStatus,
  }
}

export function mapInventoryItem(row: InventoryItemRow): InventoryItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    locationId: row.location_id,
    variantId: row.variant_id,
    quantityOnHand: Number(row.qty_on_hand),
    quantityReserved: Number(row.qty_reserved),
    status: row.status as InventoryItemStatus,
  }
}

export function stockLocationToRow(
  location: StockLocation,
  ctx: { actorUserId: string; nowIso: string },
  existing?: StockLocationRow | null,
): Database['public']['Tables']['stock_location']['Insert'] {
  const archived = location.status === 'archived'
  return {
    id: location.id,
    organization_id: location.organizationId,
    code: location.code,
    name: location.name,
    description: location.description,
    is_default: location.isDefault,
    priority: location.priority,
    status: location.status,
    archived_at: archived
      ? (existing?.archived_at ?? ctx.nowIso)
      : null,
    archived_by: archived
      ? (existing?.archived_by ?? ctx.actorUserId)
      : null,
    created_at: existing?.created_at ?? ctx.nowIso,
    updated_at: ctx.nowIso,
    created_by: existing?.created_by ?? ctx.actorUserId,
    updated_by: ctx.actorUserId,
  }
}

export function inventoryItemToRow(
  item: InventoryItem,
  ctx: { actorUserId: string; nowIso: string },
  existing?: InventoryItemRow | null,
): Database['public']['Tables']['inventory_item']['Insert'] {
  const archived = item.status === 'archived'
  return {
    id: item.id,
    organization_id: item.organizationId,
    location_id: item.locationId,
    variant_id: item.variantId,
    qty_on_hand: item.quantityOnHand,
    qty_reserved: item.quantityReserved,
    status: item.status,
    archived_at: archived
      ? (existing?.archived_at ?? ctx.nowIso)
      : null,
    archived_by: archived
      ? (existing?.archived_by ?? ctx.actorUserId)
      : null,
    created_at: existing?.created_at ?? ctx.nowIso,
    updated_at: ctx.nowIso,
    created_by: existing?.created_by ?? ctx.actorUserId,
    updated_by: ctx.actorUserId,
  }
}
