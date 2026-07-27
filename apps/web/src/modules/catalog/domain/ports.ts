import type { Money } from '#/modules/catalog/domain/value-objects/money'
import type {
  OrganizationId,
  ProductId,
  VariantId,
} from '#/modules/catalog/domain/types'

/**
 * Public Catalog ports — contracts only (DomainContracts / ADR-0020–0024).
 * No implementations in Phase 1.
 */

export type CatalogSnapshotV1 = {
  schemaVersion: 1
  organizationId: OrganizationId
  productId: ProductId
  variantId: VariantId
  productDisplayName: string
  variantDisplayName: string
  sku: string | null
  barcodes: string[]
  uomCode: string | null
  uomPrecision: number | null
  brandId: string | null
  brandName: string | null
  categoryId: string | null
  categoryPath: string | null
  attributes: Array<{
    definitionId: string
    optionId: string
    label: string
  }>
  listPrice: Money | null
  currency: Money['currency'] | null
  priceListId: string | null
  priceAsOf: string | null
  tracksInventory: boolean
  status: 'draft' | 'active' | 'archived'
}

export type ResolvedPriceV1 = {
  variantId: VariantId
  priceListId: string
  amount: Money
  currency: Money['currency']
  validFrom: string
  entryId: string
}

export type StockableItemV1 = {
  variantId: VariantId
  organizationId: OrganizationId
  status: 'draft' | 'active' | 'archived'
  unitOfMeasureId: string | null
  tracksInventory: boolean
}

export type CatalogSearchHitV1 = {
  variantId: VariantId
  productId: ProductId
  productDisplayName: string
  variantDisplayName: string
  sku: string | null
  brandName: string | null
  categoryPath: string | null
  score: number
}

export type PriceResolutionContext = {
  priceListId?: string
  at: string
}

export type CatalogSearchQuery = {
  organizationId: OrganizationId
  text: string
  brandId?: string
  categoryId?: string
  limit?: number
  offset?: number
}

/** Sales → Catalog */
export type CatalogSnapshotPort = {
  getSellableVariant(variantId: VariantId): Promise<CatalogSnapshotV1 | null>
  getSellableVariants(variantIds: VariantId[]): Promise<CatalogSnapshotV1[]>
}

/** Sales / UI → Catalog Pricing */
export type PriceResolutionPort = {
  resolve(
    variantId: VariantId,
    context: PriceResolutionContext,
  ): Promise<ResolvedPriceV1 | null>
  resolveMany(
    variantIds: VariantId[],
    context: PriceResolutionContext,
  ): Promise<ResolvedPriceV1[]>
}

/** Inventory → Catalog */
export type StockableItemPort = {
  getStockableItem(variantId: VariantId): Promise<StockableItemV1 | null>
  assertActiveStockable(variantId: VariantId): Promise<StockableItemV1>
}

/** Workspace / Sales UI → Search projection */
export type CatalogSearchPort = {
  search(query: CatalogSearchQuery): Promise<CatalogSearchHitV1[]>
}

/**
 * Inventory port consumed by Sales — declared here for contract visibility only.
 * Ownership remains Inventory (DomainContracts). Not implemented in Catalog.
 */
export type StockAllocationPort = {
  checkAvailability(
    variantId: VariantId,
    quantity: string,
  ): Promise<{ available: boolean; onHand: string }>
}
