import type {
  AddPriceEntryCommand,
  ApplyVariantCombinationsCommand,
  ApplyVariantCombinationsResponse,
  CatalogProductDetailResponse,
  CreatePriceListCommand,
  CreateBrandCommand,
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
  UpdateCategoryCommand,
  MoveCategoryCommand,
  UpdateProductCommand,
  UpdateVariantCommand,
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
export type CreateCategoryInput = CatalogOrgScope & {
  command: CreateCategoryCommand
}
export type UpdateCategoryInput = CatalogOrgScope & {
  command: UpdateCategoryCommand
}
export type MoveCategoryInput = CatalogOrgScope & {
  command: MoveCategoryCommand
}

export type CreateProductInput = CatalogOrgScope & {
  command: Omit<CreateProductCommand, 'axes' | 'skuPrefix'>
}

export type CreateProductResponse = ProductResponse

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
