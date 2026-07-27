import { createFileRoute } from '@tanstack/react-router'
import { SalesFormPage } from '#/modules/sales/ui/pages/sales-form-page'

export const Route = createFileRoute('/_app/sales/orders/$orderId/edit')({
  component: RoutePage,
})

function RoutePage() {
  const { orderId } = Route.useParams()
  return <SalesFormPage type="sales_order" id={orderId} />
}
