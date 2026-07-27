import { createFileRoute } from '@tanstack/react-router'
import { PriceListsPage } from '#/modules/catalog/ui/pages/price-lists-page'

export const Route = createFileRoute('/_app/catalog/price-lists/')({
  component: PriceListsPage,
})
