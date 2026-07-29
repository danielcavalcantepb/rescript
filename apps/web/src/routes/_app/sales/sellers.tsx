import { createFileRoute } from '@tanstack/react-router'
import { SellersPage } from '#/modules/sales/ui/pages/sellers-page'

export const Route = createFileRoute('/_app/sales/sellers')({
  component: SellersPage,
})
