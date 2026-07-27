import '#/modules/inventory/infrastructure/foundation/assert-server-only'
import type { InventoryVariantLookupPort } from '#/modules/inventory/application/foundation/ports'
import type {
  CatalogLifecycleStatus,
  InventoryVariantLookup,
  VariantId,
} from '#/modules/inventory/domain/foundation/types'
import type { InventoryFoundationReposOptions } from '#/modules/inventory/infrastructure/foundation/client-options'
import { throwIfSupabaseError } from '#/modules/inventory/infrastructure/foundation/errors'

type VariantLookupRow = {
  id: string
  organization_id: string
  product_id: string
  sku: string | null
  unit_of_measure_id: string | null
  status: string
  tracks_inventory: boolean
  product: {
    id: string
    organization_id: string
    status: string
  } | null
}

/**
 * Operational lookup — single query, no Product aggregate reconstruction.
 */
export class SupabaseVariantLookupRepository
  implements InventoryVariantLookupPort
{
  constructor(private readonly options: InventoryFoundationReposOptions) {}

  async lookupVariant(
    variantId: VariantId,
  ): Promise<InventoryVariantLookup | null> {
    const rows = await this.lookupVariants([variantId])
    return rows[0] ?? null
  }

  async lookupVariants(
    variantIds: VariantId[],
  ): Promise<InventoryVariantLookup[]> {
    if (variantIds.length === 0) return []

    const { data, error } = await this.options.client
      .from('product_variant')
      .select(
        'id, organization_id, product_id, sku, unit_of_measure_id, status, tracks_inventory, product:product!inner(id, organization_id, status)',
      )
      .eq('organization_id', this.options.organizationId)
      .in('id', variantIds)
    throwIfSupabaseError(error)

    return ((data ?? []) as unknown as VariantLookupRow[])
      .filter(
        (row) =>
          row.product &&
          row.product.organization_id === this.options.organizationId,
      )
      .map((row) => ({
        variantId: row.id,
        productId: row.product_id,
        organizationId: row.organization_id,
        variantStatus: row.status as CatalogLifecycleStatus,
        productStatus: row.product!.status as CatalogLifecycleStatus,
        unitOfMeasureId: row.unit_of_measure_id,
        sku: row.sku,
        tracksInventory: row.tracks_inventory,
      }))
  }
}
