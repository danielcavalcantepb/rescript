import type { ListCatalogProductsQuery } from '#/modules/catalog/application'

/** Catalog React Query keys — always scoped by organizationId. */
export const catalogQueryKeys = {
  all: (organizationId: string) =>
    ['rescript', 'catalog', organizationId] as const,
  products: (organizationId: string) =>
    [...catalogQueryKeys.all(organizationId), 'products'] as const,
  productList: (
    organizationId: string,
    query: ListCatalogProductsQuery,
  ) => [...catalogQueryKeys.products(organizationId), 'list', query] as const,
  productDetail: (organizationId: string, productId: string) =>
    [...catalogQueryKeys.products(organizationId), 'detail', productId] as const,
  productLifecycle: (organizationId: string, productId: string) =>
    [
      ...catalogQueryKeys.products(organizationId),
      'lifecycle',
      productId,
    ] as const,
  productVariants: (
    organizationId: string,
    productId: string,
    query?: { status?: string; page?: number; pageSize?: number },
  ) =>
    [
      ...catalogQueryKeys.products(organizationId),
      'variants',
      productId,
      query ?? {},
    ] as const,
  productVariant: (
    organizationId: string,
    productId: string,
    variantId: string,
  ) =>
    [
      ...catalogQueryKeys.products(organizationId),
      'variant',
      productId,
      variantId,
    ] as const,
  variantSearch: (organizationId: string, text: string) =>
    [...catalogQueryKeys.products(organizationId), 'variant-search', text] as const,
  variantAxes: (organizationId: string, productId: string) =>
    [
      ...catalogQueryKeys.products(organizationId),
      'variant-axes',
      productId,
    ] as const,
  combinationPreview: (
    organizationId: string,
    productId: string,
    axesKey: string,
  ) =>
    [
      ...catalogQueryKeys.products(organizationId),
      'combination-preview',
      productId,
      axesKey,
    ] as const,
  brands: (organizationId: string) =>
    [...catalogQueryKeys.all(organizationId), 'brands'] as const,
  categories: (organizationId: string) =>
    [...catalogQueryKeys.all(organizationId), 'categories'] as const,
  attributes: (organizationId: string) =>
    [...catalogQueryKeys.all(organizationId), 'attributes'] as const,
  priceLists: (organizationId: string) =>
    [...catalogQueryKeys.all(organizationId), 'price-lists'] as const,
  priceListDetail: (organizationId: string, priceListId: string) =>
    [
      ...catalogQueryKeys.priceLists(organizationId),
      'detail',
      priceListId,
    ] as const,
  variantPriceSummary: (organizationId: string, variantId: string) =>
    [
      ...catalogQueryKeys.all(organizationId),
      'variant-price-summary',
      variantId,
    ] as const,
  resolvedPrice: (
    organizationId: string,
    variantId: string,
    at: string,
    priceListId?: string,
  ) =>
    [
      ...catalogQueryKeys.all(organizationId),
      'resolved-price',
      variantId,
      at,
      priceListId ?? 'default',
    ] as const,
  units: (organizationId: string) =>
    [...catalogQueryKeys.all(organizationId), 'units'] as const,
}
