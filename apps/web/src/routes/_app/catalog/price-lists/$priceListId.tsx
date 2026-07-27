import { createFileRoute } from '@tanstack/react-router'
import { PriceListDetailsPage } from '#/modules/catalog/ui/pages/price-list-details-page'

export const Route = createFileRoute('/_app/catalog/price-lists/$priceListId')({
  component: PriceListDetailsRoute,
})

function PriceListDetailsRoute() {
  const { priceListId } = Route.useParams()
  return <PriceListDetailsPage priceListId={priceListId} />
}