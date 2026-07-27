import '#/modules/catalog/infrastructure/supabase/assert-server-only'
import type { ProductVariant } from '#/modules/catalog/domain/types'
import type { CatalogSupabaseReposOptions } from '#/modules/catalog/infrastructure/supabase/client-options'
import { throwIfSupabaseError } from '#/modules/catalog/infrastructure/supabase/errors'
import { mapVariant } from '#/modules/catalog/infrastructure/supabase/mappers'
import type {
  ProductVariantAttributeValueRow,
  ProductVariantBarcodeRow,
  ProductVariantRow,
} from '#/modules/catalog/infrastructure/supabase/persistence-types'
import { assertEntityOrganization } from '#/modules/catalog/infrastructure/supabase/tenant-context'

/**
 * Variant persistence adapter (child of Product aggregate).
 * Always scoped to the membership-verified organization on options.
 */
export class SupabaseVariantRepository {
  constructor(private readonly options: CatalogSupabaseReposOptions) {}

  async listByProductIds(
    organizationId: string,
    productIds: string[],
  ): Promise<ProductVariantRow[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    if (productIds.length === 0) return []
    const { data, error } = await this.options.client
      .from('product_variant')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .in('product_id', productIds)
    throwIfSupabaseError(error)
    return (data ?? []) as ProductVariantRow[]
  }

  async listSkus(organizationId: string): Promise<string[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('product_variant')
      .select('sku')
      .eq('organization_id', this.options.organizationId)
      .not('sku', 'is', null)
    throwIfSupabaseError(error)
    return (data ?? [])
      .map((row) => row.sku)
      .filter((sku): sku is string => typeof sku === 'string' && sku.length > 0)
  }

  async listBarcodes(organizationId: string): Promise<string[]> {
    assertEntityOrganization(organizationId, this.options.organizationId)
    const { data, error } = await this.options.client
      .from('product_variant_barcode')
      .select('barcode')
      .eq('organization_id', this.options.organizationId)
    throwIfSupabaseError(error)
    return (data ?? []).map((row) => String(row.barcode).toUpperCase())
  }

  async loadVariantsForProduct(
    organizationId: string,
    productId: string,
  ): Promise<ProductVariant[]> {
    const variants = await this.listByProductIds(organizationId, [productId])
    if (variants.length === 0) return []

    const variantIds = variants.map((v) => v.id)
    const { data: barcodes, error: barcodeError } = await this.options.client
      .from('product_variant_barcode')
      .select('*')
      .eq('organization_id', this.options.organizationId)
      .in('variant_id', variantIds)
    throwIfSupabaseError(barcodeError)

    const { data: attrs, error: attrError } = await this.options.client
      .from('product_variant_attribute_value')
      .select('*')
      .in('variant_id', variantIds)
    throwIfSupabaseError(attrError)

    const barcodesByVariant = new Map<string, ProductVariantBarcodeRow[]>()
    for (const row of (barcodes ?? []) as ProductVariantBarcodeRow[]) {
      const list = barcodesByVariant.get(row.variant_id) ?? []
      list.push(row)
      barcodesByVariant.set(row.variant_id, list)
    }

    const attrsByVariant = new Map<string, ProductVariantAttributeValueRow[]>()
    for (const row of (attrs ?? []) as ProductVariantAttributeValueRow[]) {
      const list = attrsByVariant.get(row.variant_id) ?? []
      list.push(row)
      attrsByVariant.set(row.variant_id, list)
    }

    return variants.map((variant) =>
      mapVariant(
        variant,
        barcodesByVariant.get(variant.id) ?? [],
        attrsByVariant.get(variant.id) ?? [],
      ),
    )
  }
}
