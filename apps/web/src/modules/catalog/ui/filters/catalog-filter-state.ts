import type { ListCatalogProductsQuery } from '#/modules/catalog/application'

export type CatalogProductFilters = {
  text: string
  brandId: string | null
  categoryId: string | null
  status: NonNullable<ListCatalogProductsQuery['status']>
  sort: NonNullable<ListCatalogProductsQuery['sort']>
  page: number
  pageSize: number
}

export const defaultCatalogProductFilters = (): CatalogProductFilters => ({
  text: '',
  brandId: null,
  categoryId: null,
  /** Archived products are excluded by default (Sprint 020). */
  status: 'active',
  sort: 'name_asc',
  page: 1,
  pageSize: 20,
})

export function toListCatalogProductsQuery(
  filters: CatalogProductFilters,
): ListCatalogProductsQuery {
  return {
    text: filters.text.trim() || undefined,
    brandId: filters.brandId ?? undefined,
    categoryId: filters.categoryId ?? undefined,
    status: filters.status,
    sort: filters.sort,
    page: filters.page,
    pageSize: filters.pageSize,
  }
}
