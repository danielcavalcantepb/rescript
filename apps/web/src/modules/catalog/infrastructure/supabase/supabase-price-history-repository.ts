import '#/modules/catalog/infrastructure/supabase/assert-server-only'
import type {
  CatalogPriceHistoryPort,
  PriceHistoryRecord,
} from '#/modules/catalog/application/ports/price-history'
import type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'
import { throwIfSupabaseError } from '#/modules/catalog/infrastructure/supabase/errors'
import { assertEntityOrganization } from '#/modules/catalog/infrastructure/supabase/tenant-context'

type PriceHistoryRow = {
  id: string
  organization_id: string
  price_list_id: string
  variant_id: string
  entry_id: string | null
  amount: number | string
  currency: string
  effective_at: string
  recorded_at: string
  recorded_by: string
}

export class SupabasePriceHistoryRepository implements CatalogPriceHistoryPort {
  constructor(private readonly options: CatalogSupabaseReposOptions) {}

  async listByOrganization(
    organizationId: string,
    query: {
      variantId?: string
      priceListId?: string
      limit?: number
    },
  ): Promise<PriceHistoryRecord[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200)

    let builder = this.options.client
      .from('price_history')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .order('effective_at', { ascending: false })
      .limit(limit)

    if (query.variantId) {
      builder = builder.eq('variant_id', query.variantId)
    }
    if (query.priceListId) {
      builder = builder.eq('price_list_id', query.priceListId)
    }

    const { data, error } = await builder
    throwIfSupabaseError(error)

    return ((data ?? []) as PriceHistoryRow[]).map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      priceListId: row.price_list_id,
      variantId: row.variant_id,
      entryId: row.entry_id,
      amount: String(row.amount),
      currency: row.currency,
      effectiveAt: row.effective_at,
      recordedAt: row.recorded_at,
      recordedBy: row.recorded_by,
    }))
  }
}
