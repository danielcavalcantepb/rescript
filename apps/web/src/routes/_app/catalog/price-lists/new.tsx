import { createFileRoute } from '@tanstack/react-router'
import { PriceListCreatePage } from '#/modules/catalog/ui/pages/price-list-create-page'

export const Route = createFileRoute('/_app/catalog/price-lists/new')({
  component: PriceListCreatePage,
})
