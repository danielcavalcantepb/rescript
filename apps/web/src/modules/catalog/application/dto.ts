/** Application DTOs — never reuse domain entities as API surface. */

// ─── Commands ───────────────────────────────────────────────────────────────

export type CreateProductCommand = {
  name: string
  description?: string | null
  brandId?: string | null
  primaryCategoryId?: string | null
  /** Required for simple products; optional when `axes` is set. */
  sku?: string
  unitOfMeasureId: string
  barcode?: { type: string; value: string } | null
  tracksInventory?: boolean
  /** When set, creates variable product via matrix. */
  axes?: Array<{
    attributeDefinitionId: string
    valueType: string
    allowedOptionIds: string[]
  }>
  skuPrefix?: string
}

export type UpdateProductCommand = {
  productId: string
  name?: string
  description?: string | null
  brandId?: string | null
  primaryCategoryId?: string | null
}

export type RenameProductCommand = {
  productId: string
  name: string
}

export type ProductIdCommand = {
  productId: string
}

/** Lifecycle transitions — reason is optional context, never trusted for auth. */
export type LifecycleProductCommand = {
  productId: string
  reason?: string | null
}

export type ProductLifecycleAction = 'publish' | 'archive' | 'restore' | 'deactivate'

export type ProductLifecycleHistoryItem = {
  id: string
  fromStatus: string
  toStatus: string
  action: ProductLifecycleAction
  reason: string | null
  actorUserId: string
  occurredAt: string
}

export type ProductLifecycleResponse = {
  productId: string
  status: string
  availableActions: ProductLifecycleAction[]
  history: ProductLifecycleHistoryItem[]
}

export type CreateVariantCommand = {
  productId: string
  sku: string
  unitOfMeasureId: string
  attributeValues: Array<{
    attributeDefinitionId: string
    optionId: string
  }>
  barcode?: { type: string; value: string } | null
  tracksInventory?: boolean
}

export type UpdateVariantCommand = {
  productId: string
  variantId: string
  sku?: string
  /** Primary EAN/barcode identifier. It remains owned by ProductVariant. */
  barcode?: { type: string; value: string } | null
  unitOfMeasureId?: string
  tracksInventory?: boolean
}

export type VariantIdCommand = {
  productId: string
  variantId: string
}

/** Draft axis for product-scoped matrix configuration (names, not hardcoded enums). */
export type VariantAxisDraft = {
  name: string
  options: string[]
}

export type DefineVariantAxesCommand = {
  productId: string
  axes: VariantAxisDraft[]
  /**
   * When true (default), materialize every missing combination after resolving axes.
   * When false, only `createSelectionKeys` are created.
   */
  createAllNew?: boolean
  /** Stable keys `axis=option|…` (normalized names) — not persistence ids. */
  createSelectionKeys?: string[]
  skuPrefix?: string
}

export type PreviewVariantCombinationsCommand = {
  productId: string
  /** Proposed axes; when omitted, uses current product axes. */
  axes?: VariantAxisDraft[]
}

export type ApplyVariantCombinationsCommand = {
  productId: string
  axes: VariantAxisDraft[]
  /** When true, create every missing combination. */
  createAllNew?: boolean
  /**
   * Stable selection keys from preview (`selectionKey`).
   * Preferred over raw combination hashes (ids change between preview and apply).
   */
  createSelectionKeys?: string[]
  skuPrefix?: string
}

export type AddVariantAxisCommand = {
  productId: string
  name: string
  options: string[]
}

export type RemoveVariantAxisCommand = {
  productId: string
  attributeDefinitionId: string
}

export type AddVariantOptionCommand = {
  productId: string
  attributeDefinitionId: string
  label: string
}

export type UpdateVariantOptionCommand = {
  productId: string
  attributeDefinitionId: string
  optionId: string
  label?: string
  sortOrder?: number
}

export type RemoveVariantOptionCommand = {
  productId: string
  attributeDefinitionId: string
  optionId: string
}

export type ListProductVariantsQuery = {
  productId: string
  status?: 'draft' | 'active' | 'archived' | 'all'
  page?: number
  pageSize?: number
}

export type CreateBrandCommand = {
  name: string
  description?: string | null
  sortOrder?: number
}

export type UpdateBrandCommand = {
  brandId: string
  name: string
  description?: string | null
  sortOrder?: number
}

export type BrandIdCommand = { brandId: string }

export type CreateCategoryCommand = {
  name: string
  parentId?: string | null
  description?: string | null
  sortOrder?: number
}

export type UpdateCategoryCommand = {
  categoryId: string
  name: string
  description?: string | null
  sortOrder?: number
}

export type CategoryIdCommand = { categoryId: string }

export type MoveCategoryCommand = {
  categoryId: string
  newParentId: string | null
}

export type CreateAttributeCommand = {
  name: string
  valueType: 'option' | 'text' | 'decimal' | 'boolean' | 'date'
  isVariantAxis?: boolean
  isFilterable?: boolean
  sortOrder?: number
  options?: string[]
}

export type UpdateAttributeCommand = {
  attributeId: string
  name: string
  isVariantAxis?: boolean
  isFilterable?: boolean
  sortOrder?: number
}

export type AttributeIdCommand = { attributeId: string }

export type CreateAttributeValueCommand = {
  attributeId: string
  label: string
  sortOrder?: number
}

export type UpdateAttributeValueCommand = {
  attributeId: string
  valueId: string
  label: string
  sortOrder?: number
}

export type AttributeValueIdCommand = {
  attributeId: string
  valueId: string
}

export type CreatePriceListCommand = {
  name: string
  description?: string | null
  isDefault?: boolean
  priority?: number
  currency?: string
}

export type UpdatePriceListCommand = {
  priceListId: string
  name?: string
  description?: string | null
  priority?: number
}

export type PriceListIdCommand = {
  priceListId: string
}

export type AddPriceEntryCommand = {
  priceListId: string
  variantId: string
  amount: string
  validFrom: string
}

export type UpdatePriceEntryCommand = {
  priceListId: string
  entryId: string
  amount: string
}

export type ClosePriceEntryCommand = {
  priceListId: string
  entryId: string
  validTo: string
}

export type ResolveCurrentPriceCommand = {
  priceListId?: string
  variantId: string
  at: string
  currency?: string
}

export type ListPricesByVariantQuery = {
  variantId: string
  at?: string
}

export type ListPriceHistoryQuery = {
  variantId?: string
  priceListId?: string
  limit?: number
}

// ─── Queries ────────────────────────────────────────────────────────────────

export type SearchCatalogQuery = {
  text: string
  brandId?: string
  categoryId?: string
  limit?: number
}

export type SearchVariantsQuery = {
  text: string
  productId?: string
  limit?: number
}

export type GetProductQuery = {
  productId: string
}

/** Read-only product list for Catalog UI (Phase 4A). */
export type ListCatalogProductsQuery = {
  text?: string
  brandId?: string
  categoryId?: string
  status?: 'draft' | 'active' | 'archived' | 'all'
  sort?: 'name_asc' | 'name_desc' | 'status'
  page?: number
  pageSize?: number
}

export type CatalogProductListItemResponse = {
  id: string
  name: string
  sku: string | null
  brandId: string | null
  brandName: string | null
  categoryId: string | null
  categoryName: string | null
  status: string
  basePrice: string | null
  basePriceCurrency: string | null
  variantCount: number
  /** Not on domain aggregate yet — always null in Phase 4A. */
  updatedAt: string | null
}

export type ListCatalogProductsResult = {
  items: CatalogProductListItemResponse[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─── Responses ──────────────────────────────────────────────────────────────

export type VariantResponse = {
  id: string
  productId: string
  sku: string | null
  unitOfMeasureId: string | null
  combinationHash: string
  isDefault: boolean
  tracksInventory: boolean
  status: string
  attributeValues: Array<{
    attributeDefinitionId: string
    optionId: string
  }>
  primaryBarcode: string | null
  /** Human-readable combination (e.g. "Preto / P"). Empty for default simple. */
  combinationLabel?: string
}

export type VariantAxisOptionResponse = {
  id: string
  label: string
  sortOrder: number
  status: string
}

export type VariantAxisResponse = {
  attributeDefinitionId: string
  name: string
  sortOrder: number
  options: VariantAxisOptionResponse[]
}

export type ProductVariantsResponse = {
  productId: string
  topology: string
  productStatus: string
  axes: VariantAxisResponse[]
  items: VariantResponse[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type CombinationPreviewItem = {
  combinationHash: string
  /** Stable across preview/apply — normalized axis/option names. */
  selectionKey: string
  label: string
  attributeValues: Array<{
    attributeDefinitionId: string
    optionId: string
    axisName: string
    optionLabel: string
  }>
  state: 'existing' | 'new' | 'archived' | 'obsolete'
  variantId: string | null
  sku: string | null
  status: string | null
}

export type VariantCombinationsPreviewResponse = {
  productId: string
  totalCombinations: number
  existingCount: number
  newCount: number
  archivedCount: number
  obsoleteCount: number
  requiresConfirmation: boolean
  softConfirmAbove: number
  maxCombinations: number
  maxAxes: number
  items: CombinationPreviewItem[]
  /** Axes resolved for the preview (ids + labels). */
  axes: VariantAxisResponse[]
}

export type ApplyVariantCombinationsResponse = {
  product: ProductResponse
  createdVariantIds: string[]
  preservedVariantIds: string[]
  axes: VariantAxisResponse[]
}

export type ProductResponse = {
  id: string
  organizationId: string
  name: string
  description: string | null
  brandId: string | null
  primaryCategoryId: string | null
  topology: string
  status: string
  variants: VariantResponse[]
}

/** Read model for Catalog Product Details UI (enriched from ports). */
export type CatalogProductDetailResponse = ProductResponse & {
  brandName: string | null
  categoryName: string | null
  defaultSku: string | null
  defaultUnitOfMeasureId: string | null
  defaultUnitOfMeasureCode: string | null
  defaultUnitOfMeasureName: string | null
  variantCount: number
  primaryBarcode: string | null
  /** Domain aggregate has no timestamps — always null until exposed. */
  createdAt: string | null
  updatedAt: string | null
}

export type UnitOfMeasureResponse = {
  id: string
  organizationId: string | null
  code: string
  name: string
  precision: number
  integerOnly: boolean
}

export type BrandResponse = {
  id: string
  organizationId: string
  name: string
  slug?: string
  description?: string | null
  sortOrder?: number
  status: string
}

export type CategoryResponse = {
  id: string
  organizationId: string
  parentId: string | null
  name: string
  slug?: string
  description?: string | null
  sortOrder?: number
  depth: number
  status: string
}

export type AttributeValueResponse = {
  id: string
  label: string
  normalizedLabel: string
  sortOrder: number
  status: string
}

export type AttributeResponse = {
  id: string
  organizationId: string
  name: string
  normalizedName: string
  valueType: string
  isVariantAxis: boolean
  isFilterable: boolean
  sortOrder: number
  status: string
  values: AttributeValueResponse[]
}

export type PriceListResponse = {
  id: string
  organizationId: string
  name: string
  description: string | null
  currency: string
  isDefault: boolean
  priority: number
  status: string
  entryCount: number
}

export type PriceListDetailResponse = PriceListResponse & {
  entries: PriceEntryResponse[]
}

export type PriceEntryResponse = {
  id: string
  priceListId: string
  variantId: string
  amount: string
  currency: string
  validFrom: string
  validTo: string | null
  validityState?: 'current' | 'future' | 'expired' | 'unbounded'
}

export type ResolvedPriceResponse = {
  variantId: string
  priceListId: string
  priceListName: string
  amount: string
  currency: string
  validFrom: string
  validTo: string | null
  entryId: string
  priority: number
}

export type VariantPriceSummaryResponse = {
  variantId: string
  productId: string
  resolved: ResolvedPriceResponse | null
  lists: Array<{
    priceListId: string
    priceListName: string
    isDefault: boolean
    priority: number
    amount: string | null
    currency: string | null
    status: string
  }>
}

export type PriceHistoryItemResponse = {
  id: string
  priceListId: string
  variantId: string
  entryId: string | null
  amount: string
  currency: string
  effectiveAt: string
  recordedAt: string
  recordedBy: string
}

export type CatalogSearchHitResponse = {
  variantId: string
  productId: string
  productName: string
  variantSku: string | null
  brandId: string | null
  categoryId: string | null
  status: string
}
