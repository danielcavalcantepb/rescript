import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate } from '#/platform/permissions'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { CatalogFilters } from '#/modules/catalog/ui/components/CatalogFilters'
import { CatalogPagination } from '#/modules/catalog/ui/components/CatalogPagination'
import { CatalogTable } from '#/modules/catalog/ui/components/CatalogTable'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'
import { ProductQuickCreate } from '#/modules/catalog/ui/components/product-registration/ProductQuickCreate'
import { CatalogEmptyState } from '#/modules/catalog/ui/empty-states/CatalogEmptyState'
import {
  defaultCatalogProductFilters,
  toListCatalogProductsQuery,
  type CatalogProductFilters,
} from '#/modules/catalog/ui/filters/catalog-filter-state'
import {
  filtersToSearch,
  searchToFilters,
  type CatalogProductsSearch,
} from '#/modules/catalog/ui/filters/catalog-list-search'
import { useBrands } from '#/modules/catalog/ui/hooks/use-catalog-brands'
import { useCategories } from '#/modules/catalog/ui/hooks/use-catalog-categories'
import { useCatalogProducts } from '#/modules/catalog/ui/hooks/use-catalog-products'
import { useUnits } from '#/modules/catalog/ui/hooks/use-catalog-units'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { CatalogLoadingState } from '#/modules/catalog/ui/loading/CatalogLoadingState'

export function CatalogProductsPage({
  search,
}: {
  search: CatalogProductsSearch
}) {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const orgActive = currentOrganization?.status === 'active'

  const filters = searchToFilters(search)
  const filtersRef = useRef(filters)
  filtersRef.current = filters
  const [text, setText] = useState(filters.text)
  const [debouncedText, setDebouncedText] = useState(filters.text.trim())
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  useEffect(() => {
    setText(filters.text)
  }, [filters.text])

  useEffect(() => {
    const t = window.setTimeout(() => {
      const next = text.trim()
      setDebouncedText(next)
      if (next !== (search.q ?? '')) {
        void navigate({
          to: '/catalog/products',
          search: filtersToSearch({
            ...filtersRef.current,
            text: next,
            page: 1,
          }),
          replace: true,
        })
      }
    }, 250)
    return () => window.clearTimeout(t)
  }, [text, navigate, search.q])

  const query = toListCatalogProductsQuery({
    ...filters,
    text: debouncedText,
  })
  const listSearch = filtersToSearch({ ...filters, text: debouncedText })

  const productsQuery = useCatalogProducts(
    organizationId,
    query,
    Boolean(organizationId) && orgActive,
  )
  const brandsQuery = useBrands(
    organizationId,
    Boolean(organizationId) && orgActive,
  )
  const categoriesQuery = useCategories(
    organizationId,
    Boolean(organizationId) && orgActive,
  )
  const unitsQuery = useUnits(
    organizationId,
    Boolean(organizationId) && orgActive,
  )

  const onFilterChange = (next: Partial<CatalogProductFilters>) => {
    if (next.text !== undefined) {
      setText(next.text)
      return
    }
    void navigate({
      to: '/catalog/products',
      search: filtersToSearch({ ...filters, ...next, text: debouncedText }),
      replace: true,
    })
  }

  const onClearFilters = () => {
    const defaults = defaultCatalogProductFilters()
    setText(defaults.text)
    setDebouncedText(defaults.text)
    void navigate({
      to: '/catalog/products',
      search: filtersToSearch(defaults),
      replace: true,
    })
  }

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  const items = productsQuery.data?.items ?? []
  const total = productsQuery.data?.total ?? 0
  const page = productsQuery.data?.page ?? filters.page
  const totalPages = productsQuery.data?.totalPages ?? 1
  const showEmpty =
    productsQuery.isSuccess && items.length === 0 && !productsQuery.isFetching

  const uiFilters: CatalogProductFilters = { ...filters, text }

  return (
    <CatalogShell
      title="Produtos"
      description="Catálogo central e acesso ao workspace de cada produto."
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Produtos' },
      ]}
      actions={
        <FeatureGate permission="products.create">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild>
              <Link to="/catalog/products/new" search={listSearch}>
                Cadastro avançado
              </Link>
            </Button>
            <Button onClick={() => setQuickCreateOpen(true)}>Novo produto</Button>
          </div>
        </FeatureGate>
      }
    >
      <CatalogToolbar
        title="Produtos"
        description="Busque, filtre e abra um produto para gerenciar todo o seu ciclo de vida."
      />

      <CatalogFilters
        filters={uiFilters}
        brands={brandsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        onChange={onFilterChange}
        onClear={onClearFilters}
      />

      {productsQuery.isError ? (
        <CatalogErrorState onRetry={() => void productsQuery.refetch()} />
      ) : productsQuery.isLoading ? (
        <CatalogLoadingState />
      ) : showEmpty ? (
        <CatalogEmptyState
          action={
            <FeatureGate permission="products.create">
              <Button asChild>
                <Link to="/catalog/products/new" search={listSearch}>
                  Novo produto
                </Link>
              </Button>
            </FeatureGate>
          }
        />
      ) : (
        <>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {productsQuery.isFetching
              ? 'Atualizando lista de produtos…'
              : `${total} produtos encontrados`}
          </div>
          <CatalogTable items={items} listSearch={listSearch} />
          <CatalogPagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(nextPage) => onFilterChange({ page: nextPage })}
          />
        </>
      )}
      <ProductQuickCreate
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        organizationId={organizationId}
        brands={brandsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        units={unitsQuery.data ?? []}
      />
    </CatalogShell>
  )
}
