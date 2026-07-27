import { createFileRoute } from '@tanstack/react-router'
import { SalesFormPage } from '#/modules/sales/ui/pages/sales-form-page'

export const Route = createFileRoute('/_app/sales/orders/new')({
  component: () => <SalesFormPage type="sales_order" />,
})
