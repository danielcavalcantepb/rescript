import type { CatalogProductFilters } from '#/modules/catalog/ui/filters/catalog-filter-state'
import { defaultCatalogProductFilters } from '#/modules/catalog/ui/filters/catalog-filter-state'

export type CatalogProductsSearch = {
  q?: string
  brandId?: string
  categoryId?: string
  status?: CatalogProductFilters['status']
  sort?: CatalogProductFilters['sort']
  page?: number
}

export function parseCatalogProductsSearch(
  search: Record<string, unknown>,
): CatalogProductsSearch {
  const status = search.status
  const sort = search.sort
  return {
    q: typeof search.q === 'string' ? search.q : undefined,
    brandId: typeof search.brandId === 'string' ? search.brandId : undefined,
    categoryId:
      typeof search.categoryId === 'string' ? search.categoryId : undefined,
    status:
      status === 'draft' ||
      status === 'active' ||
      status === 'archived' ||
      status === 'all'
        ? status
        : undefined,
    sort:
      sort === 'name_asc' || sort === 'name_desc' || sort === 'status'
        ? sort
        : undefined,
    page: typeof search.page === 'number' && search.page > 0 ? search.page : undefined,
  }
}

export function searchToFilters(
  search: CatalogProductsSearch,
): CatalogProductFilters {
  const defaults = defaultCatalogProductFilters()
  return {
    text: search.q ?? defaults.text,
    brandId: search.brandId ?? null,
    categoryId: search.categoryId ?? null,
    status: search.status ?? defaults.status,
    sort: search.sort ?? defaults.sort,
    page: search.page ?? defaults.page,
    pageSize: defaults.pageSize,
  }
}

export function filtersToSearch(
  filters: CatalogProductFilters,
): CatalogProductsSearch {
  return {
    q: filters.text.trim() || undefined,
    brandId: filters.brandId ?? undefined,
    categoryId: filters.categoryId ?? undefined,
    status: filters.status === 'active' ? undefined : filters.status,
    sort: filters.sort === 'name_asc' ? undefined : filters.sort,
    page: filters.page === 1 ? undefined : filters.page,
  }
}
