import { createFileRoute } from '@tanstack/react-router'
import { SalesListPage } from '#/modules/sales/ui/pages/sales-list-page'

export const Route = createFileRoute('/_app/sales/orders/')({
  component: () => <SalesListPage type="sales_order" />,
})
