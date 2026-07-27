import { createFileRoute } from '@tanstack/react-router'
import { PurchasesListPage } from '#/modules/purchase/ui/pages/purchases-list-page'

export const Route = createFileRoute('/_app/procurement/purchases/')({
  component: PurchasesListPage,
})
