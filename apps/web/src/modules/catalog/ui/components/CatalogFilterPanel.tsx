import { FilterChip } from '#/components/FilterChip'
import type { BrandResponse, CategoryResponse } from '#/modules/catalog/application'
import type { CatalogProductFilters } from '#/modules/catalog/ui/filters/catalog-filter-state'

export function CatalogFilterPanel({
  filters,
  brands,
  categories,
  onChange,
  onClear,
}: {
  filters: CatalogProductFilters
  brands: BrandResponse[]
  categories: CategoryResponse[]
  onChange: (next: Partial<CatalogProductFilters>) => void
  onClear: () => void
}) {
  const hasFilters =
    Boolean(filters.text) ||
    Boolean(filters.brandId) ||
    Boolean(filters.categoryId) ||
    filters.status !== 'active' ||
    filters.sort !== 'name_asc'

  return (
    <div
      className="flex flex-col gap-3"
      role="group"
      aria-label="Filtros do catálogo"
    >
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ['active', 'Ativos'],
            ['draft', 'Rascunhos'],
            ['archived', 'Arquivados'],
            ['all', 'Todos'],
          ] as const
        ).map(([value, label]) => (
          <FilterChip
            key={value}
            label={label}
            selected={filters.status === value}
            onSelect={() => onChange({ status: value, page: 1 })}
          />
        ))}
        {hasFilters ? (
          <button
            type="button"
            className="ml-auto text-[12px] font-medium text-[var(--color-text-secondary)] underline-offset-4 hover:text-[var(--color-ink)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            onClick={onClear}
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-[12px] text-[var(--color-text-secondary)]">
          Marca
          <select
            className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[13px] text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            value={filters.brandId ?? ''}
            onChange={(e) =>
              onChange({
                brandId: e.target.value || null,
                page: 1,
              })
            }
          >
            <option value="">Todas</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-[12px] text-[var(--color-text-secondary)]">
          Categoria
          <select
            className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[13px] text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            value={filters.categoryId ?? ''}
            onChange={(e) =>
              onChange({
                categoryId: e.target.value || null,
                page: 1,
              })
            }
          >
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-[12px] text-[var(--color-text-secondary)]">
          Ordenação
          <select
            className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[13px] text-[var(--color-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            value={filters.sort}
            onChange={(e) =>
              onChange({
                sort: e.target.value as CatalogProductFilters['sort'],
                page: 1,
              })
            }
          >
            <option value="name_asc">Nome (A–Z)</option>
            <option value="name_desc">Nome (Z–A)</option>
            <option value="status">Status</option>
          </select>
        </label>
      </div>
    </div>
  )
}
