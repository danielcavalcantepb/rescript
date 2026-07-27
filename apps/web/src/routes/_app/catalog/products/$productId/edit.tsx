import { createFileRoute } from '@tanstack/react-router'
import { parseCatalogProductsSearch } from '#/modules/catalog/ui/filters/catalog-list-search'
import { ProductEditPage } from '#/modules/catalog/ui/pages/product-edit-page'

export const Route = createFileRoute('/_app/catalog/products/$productId/edit')({
  validateSearch: (search) => parseCatalogProductsSearch(search),
  component: ProductEditRoute,
})

function ProductEditRoute() {
  const { productId } = Route.useParams()
  const search = Route.useSearch()
  return <ProductEditPage productId={productId} listSearch={search} />
}
