import '#/modules/inventory/infrastructure/foundation/assert-server-only'
import type { InventoryItemRepository } from '#/modules/inventory/application/foundation/ports'
import type { InventoryItem } from '#/modules/inventory/domain/foundation/types'
import type { InventoryFoundationReposOptions } from '#/modules/inventory/infrastructure/foundation/client-options'
import { resolveNowIso } from '#/modules/inventory/infrastructure/foundation/client-options'
import { throwIfSupabaseError } from '#/modules/inventory/infrastructure/foundation/errors'
import {
  inventoryItemToRow,
  mapInventoryItem,
} from '#/modules/inventory/infrastructure/foundation/mappers'
import { assertEntityOrganization } from '#/modules/inventory/infrastructure/foundation/tenant-context'
import type { Database } from '@rescript/database'

type Row = Database['public']['Tables']['inventory_item']['Row']

export class SupabaseInventoryItemRepository
  implements InventoryItemRepository
{
  constructor(private readonly options: InventoryFoundationReposOptions) {}

  async getById(
    organizationId: string,
    inventoryItemId: string,
  ): Promise<InventoryItem | null> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('inventory_item')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', inventoryItemId)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapInventoryItem(data as Row) : null
  }

  async getByVariantAndLocation(
    organizationId: string,
    variantId: string,
    locationId: string,
  ): Promise<InventoryItem | null> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('inventory_item')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('variant_id', variantId)
      .eq('location_id', locationId)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapInventoryItem(data as Row) : null
  }

  async listByOrganization(
    organizationId: string,
    query?: { variantId?: string; locationId?: string; status?: string },
  ): Promise<InventoryItem[]> {
    this.assertOrg(organizationId)
    let builder = this.options.client
      .from('inventory_item')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .order('updated_at', { ascending: false })

    if (query?.variantId) builder = builder.eq('variant_id', query.variantId)
    if (query?.locationId) builder = builder.eq('location_id', query.locationId)
    if (query?.status) builder = builder.eq('status', query.status)

    const { data, error } = await builder
    throwIfSupabaseError(error)
    return ((data ?? []) as Row[]).map(mapInventoryItem)
  }

  async save(item: InventoryItem): Promise<void> {
    assertEntityOrganization(item.organizationId, this.options.organizationId)
    const ctx = {
      actorUserId: this.options.actorUserId,
      nowIso: resolveNowIso(this.options),
    }
    const { data: existing, error: existingError } = await this.options.client
      .from('inventory_item')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', item.id)
      .maybeSingle()
    throwIfSupabaseError(existingError)

    const row = inventoryItemToRow(item, ctx, existing as Row | null)
    const { error } = await this.options.client
      .from('inventory_item')
      .upsert(row)
    throwIfSupabaseError(error)
  }

  private assertOrg(organizationId: string) {
    assertEntityOrganization(organizationId, this.options.organizationId)
  }
}
