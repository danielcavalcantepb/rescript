import { createFileRoute } from '@tanstack/react-router'
import { parseCatalogProductsSearch } from '#/modules/catalog/ui/filters/catalog-list-search'
import { ProductCreatePage } from '#/modules/catalog/ui/pages/product-create-page'

export const Route = createFileRoute('/_app/catalog/products/new')({
  validateSearch: (search) => parseCatalogProductsSearch(search),
  component: ProductCreateRoute,
})

function ProductCreateRoute() {
  const search = Route.useSearch()
  return <ProductCreatePage listSearch={search} />
}
