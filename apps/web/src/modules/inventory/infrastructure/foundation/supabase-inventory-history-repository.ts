import '#/modules/inventory/infrastructure/foundation/assert-server-only'
import type {
  InventoryHistoryPort,
  InventoryHistoryRecord,
} from '#/modules/inventory/application/foundation/ports'
import type { InventoryFoundationReposOptions } from '#/modules/inventory/infrastructure/foundation/client-options'
import { resolveNowIso } from '#/modules/inventory/infrastructure/foundation/client-options'
import { throwIfSupabaseError } from '#/modules/inventory/infrastructure/foundation/errors'
import { assertEntityOrganization } from '#/modules/inventory/infrastructure/foundation/tenant-context'
import type { Database } from '@rescript/database'

type Row = Database['public']['Tables']['inventory_item_history']['Row']

export class SupabaseInventoryHistoryRepository
  implements InventoryHistoryPort
{
  constructor(private readonly options: InventoryFoundationReposOptions) {}

  async append(
    record: Omit<InventoryHistoryRecord, 'id' | 'recordedAt'> & {
      id?: string
      recordedAt?: string
    },
  ): Promise<void> {
    assertEntityOrganization(
      record.organizationId,
      this.options.organizationId,
    )
    const { error } = await this.options.client
      .from('inventory_item_history')
      .insert({
        id: record.id,
        organization_id: this.options.organizationId,
        inventory_item_id: record.inventoryItemId,
        location_id: record.locationId,
        variant_id: record.variantId,
        field_name: record.fieldName,
        previous_value: record.previousValue,
        new_value: record.newValue,
        reason: record.reason,
        recorded_at: record.recordedAt ?? resolveNowIso(this.options),
        recorded_by: this.options.actorUserId,
      })
    throwIfSupabaseError(error)
  }

  async listByOrganization(
    organizationId: string,
    query?: {
      inventoryItemId?: string
      variantId?: string
      limit?: number
    },
  ): Promise<InventoryHistoryRecord[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const limit = Math.min(Math.max(query?.limit ?? 50, 1), 200)
    let builder = this.options.client
      .from('inventory_item_history')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .order('recorded_at', { ascending: false })
      .limit(limit)

    if (query?.inventoryItemId) {
      builder = builder.eq('inventory_item_id', query.inventoryItemId)
    }
    if (query?.variantId) {
      builder = builder.eq('variant_id', query.variantId)
    }

    const { data, error } = await builder
    throwIfSupabaseError(error)
    return ((data ?? []) as Row[]).map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      inventoryItemId: row.inventory_item_id,
      locationId: row.location_id,
      variantId: row.variant_id,
      fieldName: row.field_name,
      previousValue: row.previous_value,
      newValue: row.new_value,
      reason: row.reason,
      recordedAt: row.recorded_at,
      recordedBy: row.recorded_by,
    }))
  }
}
