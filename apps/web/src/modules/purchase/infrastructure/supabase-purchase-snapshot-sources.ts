import '#/modules/purchase/infrastructure/assert-server-only'
import type { PurchaseSnapshotSources } from '#/modules/purchase/application/ports'
import type {
  PriceSnapshot,
  SupplierSnapshot,
  VariantSnapshot,
} from '#/modules/purchase/domain/types'
import type { PurchaseReposOptions } from '#/modules/purchase/infrastructure/client-options'
import { throwIfSupabaseError } from '#/modules/purchase/infrastructure/errors'
import { assertEntityOrganization } from '#/modules/purchase/infrastructure/tenant-context'

type VariantRow = {
  id: string
  sku: string | null
  product: { name: string; description: string | null } | null
  unit_of_measure: { code: string } | null
}

type PriceEntryRow = {
  amount: number
  currency: string
  price_list_id: string
  valid_to: string | null
  price_list: {
    status: string
    priority: number
    is_default: boolean
  }
}

function formatVariantName(productName: string, sku: string | null): string {
  const trimmedSku = sku?.trim()
  return trimmedSku ? `${productName} · ${trimmedSku}` : productName
}

export class SupabasePurchaseSnapshotSources implements PurchaseSnapshotSources {
  constructor(private readonly options: PurchaseReposOptions) {}

  async getSupplierSnapshot(
    organizationId: string,
    supplierId: string,
  ): Promise<SupplierSnapshot | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('supplier')
      .select('id, name, document, email, phone')
      .eq('organization_id', this.options.organizationId)
      .eq('id', supplierId)
      .maybeSingle()
    throwIfSupabaseError(error)
    if (!data) return null
    return {
      supplierId: data.id,
      legalName: data.name,
      document: data.document,
      email: data.email,
      phone: data.phone,
    }
  }

  async getVariantSnapshot(
    organizationId: string,
    variantId: string,
  ): Promise<VariantSnapshot | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('product_variant')
      .select(
        `
        id,
        sku,
        product:product_id ( name, description ),
        unit_of_measure:unit_of_measure_id ( code )
      `,
      )
      .eq('organization_id', this.options.organizationId)
      .eq('id', variantId)
      .maybeSingle()
    throwIfSupabaseError(error)
    if (!data) return null
    const row = data as unknown as VariantRow
    const productName = row.product?.name?.trim()
    if (!productName) return null
    return {
      variantId: row.id,
      sku: row.sku,
      name: formatVariantName(productName, row.sku),
      unitCode: row.unit_of_measure?.code?.trim() || 'UN',
      description: row.product?.description ?? null,
    }
  }

  async resolvePriceSnapshot(
    organizationId: string,
    variantId: string,
    currency: string,
  ): Promise<PriceSnapshot | null> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const now = new Date().toISOString()
    const { data, error } = await this.options.client
      .from('price_list_entry')
      .select(
        `
        amount,
        currency,
        price_list_id,
        valid_to,
        price_list!inner (
          status,
          priority,
          is_default
        )
      `,
      )
      .eq('organization_id', this.options.organizationId)
      .eq('variant_id', variantId)
      .eq('currency', currency.toUpperCase())
      .eq('price_list.status', 'active')
    throwIfSupabaseError(error)

    const rows = (data ?? []) as unknown as PriceEntryRow[]
    const effective = rows.filter(
      (row) => !row.valid_to || row.valid_to > now,
    )
    effective.sort((a, b) => {
      const priorityDiff = a.price_list.priority - b.price_list.priority
      if (priorityDiff !== 0) return priorityDiff
      return Number(b.price_list.is_default) - Number(a.price_list.is_default)
    })

    const best = effective[0]
    if (!best) return null

    return {
      currency: best.currency,
      unitPrice: Number(best.amount).toFixed(4),
      priceListId: best.price_list_id,
      source: 'price_list',
    }
  }
}
