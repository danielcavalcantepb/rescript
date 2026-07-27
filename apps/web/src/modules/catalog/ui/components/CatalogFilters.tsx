import type { BrandResponse, CategoryResponse } from '#/modules/catalog/application'
import { CatalogFilterPanel } from '#/modules/catalog/ui/components/CatalogFilterPanel'
import { CatalogSearchInput } from '#/modules/catalog/ui/components/CatalogSearchInput'
import type { CatalogProductFilters } from '#/modules/catalog/ui/filters/catalog-filter-state'

export function CatalogFilters({
  filters,
  brands,
  categories,
  onChange,
}: {
  filters: CatalogProductFilters
  brands: BrandResponse[]
  categories: CategoryResponse[]
  onChange: (next: Partial<CatalogProductFilters>) => void
}) {
  return (
    <div className="mb-4 space-y-3">
      <CatalogSearchInput
        value={filters.text}
        onChange={(text) => onChange({ text, page: 1 })}
      />
      <CatalogFilterPanel
        filters={filters}
        brands={brands}
        categories={categories}
        onChange={onChange}
      />
    </div>
  )
}
