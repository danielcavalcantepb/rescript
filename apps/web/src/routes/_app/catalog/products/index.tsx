import { createFileRoute } from '@tanstack/react-router'
import { CatalogProductsPage } from '#/modules/catalog/ui/pages/catalog-products-page'
import { parseCatalogProductsSearch } from '#/modules/catalog/ui/filters/catalog-list-search'

export const Route = createFileRoute('/_app/catalog/products/')({
  validateSearch: (search) => parseCatalogProductsSearch(search),
  component: CatalogProductsRoute,
})

function CatalogProductsRoute() {
  const search = Route.useSearch()
  return <CatalogProductsPage search={search} />
}
