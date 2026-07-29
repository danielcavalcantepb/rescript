import type {
  AddPriceEntryCommand,
  ApplyVariantCombinationsCommand,
  ApplyVariantCombinationsResponse,
  CatalogProductDetailResponse,
  CreatePriceListCommand,
  CreateBrandCommand,
  BrandIdCommand,
  CategoryIdCommand,
  AttributeIdCommand,
  AttributeValueIdCommand,
  CreateAttributeCommand,
  CreateAttributeValueCommand,
  CreateCategoryCommand,
  CreateProductCommand,
  LifecycleProductCommand,
  ListCatalogProductsQuery,
  ListCatalogProductsResult,
  ListProductVariantsQuery,
  PriceEntryResponse,
  PriceListDetailResponse,
  PriceListIdCommand,
  PriceListResponse,
  PreviewVariantCombinationsCommand,
  ProductLifecycleResponse,
  ProductResponse,
  ProductVariantsResponse,
  ResolveCurrentPriceCommand,
  ResolvedPriceResponse,
  CatalogSearchHitResponse,
  SearchVariantsQuery,
  UpdatePriceListCommand,
  UpdateBrandCommand,
  UpdateAttributeCommand,
  UpdateAttributeValueCommand,
  UpdateCategoryCommand,
  MoveCategoryCommand,
  UpdateProductCommand,
  UpdateVariantCommand,
  ProductCreationCommand,
  VariantCombinationsPreviewResponse,
  VariantIdCommand,
  VariantPriceSummaryResponse,
  VariantResponse,
} from '#/modules/catalog/application'

/**
 * Serializable RPC contracts for Catalog Product Management (Phase 4B).
 * organizationId is a membership selection claim — never trusted alone;
 * actor + tenant are pinned from JWT + membership on the server.
 */

export type CatalogRpcErrorCode =
  | 'validation'
  | 'conflict'
  | 'not_found'
  | 'forbidden'
  | 'unauthenticated'
  | 'unavailable'
  | 'unexpected'

export type CatalogRpcError = {
  code: CatalogRpcErrorCode
  message: string
  fieldErrors?: Record<string, string>
}

export type CatalogRpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: CatalogRpcError }

export type CatalogOrgScope = {
  /** Active organization the user selected — verified via membership. */
  organizationId: string
}

export type CreateBrandInput = CatalogOrgScope & {
  command: CreateBrandCommand
}
export type UpdateBrandInput = CatalogOrgScope & {
  command: UpdateBrandCommand
}
export type ArchiveBrandInput = CatalogOrgScope & {
  command: BrandIdCommand
}
export type CreateCategoryInput = CatalogOrgScope & {
  command: CreateCategoryCommand
}
export type UpdateCategoryInput = CatalogOrgScope & {
  command: UpdateCategoryCommand
}
export type MoveCategoryInput = CatalogOrgScope & {
  command: MoveCategoryCommand
}
export type ArchiveCategoryInput = CatalogOrgScope & {
  command: CategoryIdCommand
}
export type CreateAttributeInput = CatalogOrgScope & {
  command: CreateAttributeCommand
}
export type UpdateAttributeInput = CatalogOrgScope & {
  command: UpdateAttributeCommand
}
export type ArchiveAttributeInput = CatalogOrgScope & {
  command: AttributeIdCommand
}
export type DeleteAttributeInput = CatalogOrgScope & {
  command: AttributeIdCommand
}
export type CreateAttributeValueInput = CatalogOrgScope & {
  command: CreateAttributeValueCommand
}
export type UpdateAttributeValueInput = CatalogOrgScope & {
  command: UpdateAttributeValueCommand
}
export type ArchiveAttributeValueInput = CatalogOrgScope & {
  command: AttributeValueIdCommand
}

export type CreateProductInput = CatalogOrgScope & {
  command: CreateProductCommand
}

export type CreateProductResponse = ProductResponse

export type CreateProductWithInitialSetupInput = CatalogOrgScope & {
  command: ProductCreationCommand
  idempotencyKey: string
}

export type ProductCreationResult = {
  productId: string
  branchId: string
  priceListId: string
  variants: Array<{
    variantId: string
    priceEntryId: string
    ledgerEntryId: string | null
  }>
}

export type GetProductInput = CatalogOrgScope & {
  productId: string
}

export type GetProductResponse = CatalogProductDetailResponse

export type UpdateProductInput = CatalogOrgScope & {
  command: UpdateProductCommand
}

export type UpdateProductResponse = ProductResponse

export type ListCatalogProductsInput = CatalogOrgScope & {
  query?: ListCatalogProductsQuery
}

export type ListCatalogProductsResponse = ListCatalogProductsResult

export type LifecycleProductInput = CatalogOrgScope & {
  command: LifecycleProductCommand
}

export type LifecycleProductResponse = ProductResponse

export type GetLifecycleInput = CatalogOrgScope & {
  productId: string
}

export type GetLifecycleResponse = ProductLifecycleResponse

export type ListProductVariantsInput = CatalogOrgScope & {
  query: ListProductVariantsQuery
}

export type ListProductVariantsResponse = ProductVariantsResponse

export type PreviewVariantCombinationsInput = CatalogOrgScope & {
  command: PreviewVariantCombinationsCommand
}

export type PreviewVariantCombinationsResponse = VariantCombinationsPreviewResponse

export type ApplyVariantCombinationsInput = CatalogOrgScope & {
  command: ApplyVariantCombinationsCommand
}

export type ApplyVariantCombinationsRpcResponse = ApplyVariantCombinationsResponse

export type VariantLifecycleInput = CatalogOrgScope & {
  command: VariantIdCommand
}

export type VariantLifecycleResponse = VariantResponse

export type UpdateVariantInput = CatalogOrgScope & {
  command: UpdateVariantCommand
}

export type UpdateVariantResponse = VariantResponse

export type ListPriceListsResponse = PriceListResponse[]

export type GetPriceListInput = CatalogOrgScope & { priceListId: string }
export type GetPriceListResponse = PriceListDetailResponse

export type CreatePriceListInput = CatalogOrgScope & {
  command: CreatePriceListCommand
}
export type CreatePriceListResponse = PriceListResponse

export type UpdatePriceListInput = CatalogOrgScope & {
  command: UpdatePriceListCommand
}
export type UpdatePriceListResponse = PriceListResponse

export type PriceListLifecycleInput = CatalogOrgScope & {
  command: PriceListIdCommand
}
export type PriceListLifecycleResponse = PriceListResponse

export type AddPriceEntryInput = CatalogOrgScope & {
  command: AddPriceEntryCommand
}
export type AddPriceEntryResponse = PriceEntryResponse

export type ResolvePriceInput = CatalogOrgScope & {
  command: ResolveCurrentPriceCommand
}
export type ResolvePriceResponse = ResolvedPriceResponse

export type VariantPriceSummaryInput = CatalogOrgScope & {
  variantId: string
}
export type VariantPriceSummaryRpcResponse = VariantPriceSummaryResponse

export type SearchVariantsInput = CatalogOrgScope & {
  query: SearchVariantsQuery
}
export type SearchVariantsResponse = CatalogSearchHitResponse[]
