import '#/modules/inventory/infrastructure/foundation/assert-server-only'
import type { StockLocationRepository } from '#/modules/inventory/application/foundation/ports'
import type { StockLocation } from '#/modules/inventory/domain/foundation/types'
import type { InventoryFoundationReposOptions } from '#/modules/inventory/infrastructure/foundation/client-options'
import { resolveNowIso } from '#/modules/inventory/infrastructure/foundation/client-options'
import { throwIfSupabaseError } from '#/modules/inventory/infrastructure/foundation/errors'
import {
  mapStockLocation,
  stockLocationToRow,
} from '#/modules/inventory/infrastructure/foundation/mappers'
import { assertEntityOrganization } from '#/modules/inventory/infrastructure/foundation/tenant-context'
import type { Database } from '@rescript/database'

type Row = Database['public']['Tables']['stock_location']['Row']

export class SupabaseStockLocationRepository
  implements StockLocationRepository
{
  constructor(private readonly options: InventoryFoundationReposOptions) {}

  async getById(
    organizationId: string,
    locationId: string,
  ): Promise<StockLocation | null> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('stock_location')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', locationId)
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapStockLocation(data as Row) : null
  }

  async getDefault(organizationId: string): Promise<StockLocation | null> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('stock_location')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('is_default', true)
      .neq('status', 'archived')
      .maybeSingle()
    throwIfSupabaseError(error)
    return data ? mapStockLocation(data as Row) : null
  }

  async listByOrganization(organizationId: string): Promise<StockLocation[]> {
    this.assertOrg(organizationId)
    const { data, error } = await this.options.client
      .from('stock_location')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .order('priority', { ascending: false })
      .order('name', { ascending: true })
    throwIfSupabaseError(error)
    return ((data ?? []) as Row[]).map(mapStockLocation)
  }

  async save(location: StockLocation): Promise<void> {
    assertEntityOrganization(
      location.organizationId,
      this.options.organizationId,
    )
    const ctx = {
      actorUserId: this.options.actorUserId,
      nowIso: resolveNowIso(this.options),
    }

    const { data: existing, error: existingError } = await this.options.client
      .from('stock_location')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .eq('id', location.id)
      .maybeSingle()
    throwIfSupabaseError(existingError)

    if (
      location.isDefault &&
      location.status !== 'archived'
    ) {
      const { error: clearError } = await this.options.client
        .from('stock_location')
        .update({
          is_default: false,
          updated_by: this.options.actorUserId,
          updated_at: ctx.nowIso,
        })
        .eq('organization_id', this.options.organizationId)
        .eq('is_default', true)
        .neq('id', location.id)
      throwIfSupabaseError(clearError)
    }

    const row = stockLocationToRow(location, ctx, existing as Row | null)
    const { error } = await this.options.client
      .from('stock_location')
      .upsert(row)
    throwIfSupabaseError(error)
  }

  private assertOrg(organizationId: string) {
    assertEntityOrganization(organizationId, this.options.organizationId)
  }
}
