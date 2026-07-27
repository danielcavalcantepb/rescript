import { createFileRoute } from '@tanstack/react-router'
import { parseCatalogProductsSearch } from '#/modules/catalog/ui/filters/catalog-list-search'
import { ProductDetailsPage } from '#/modules/catalog/ui/pages/product-details-page'

export const Route = createFileRoute('/_app/catalog/products/$productId/')({
  validateSearch: (search) => parseCatalogProductsSearch(search),
  component: ProductDetailsRoute,
})

function ProductDetailsRoute() {
  const { productId } = Route.useParams()
  const search = Route.useSearch()
  return <ProductDetailsPage productId={productId} listSearch={search} />
}
