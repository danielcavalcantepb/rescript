import { createFileRoute } from '@tanstack/react-router'
import { SalesDocumentPage } from '#/modules/sales/ui/pages/sales-document-page'

export const Route = createFileRoute('/_app/sales/orders/$orderId')({
  component: RoutePage,
})

function RoutePage() {
  const { orderId } = Route.useParams()
  return <SalesDocumentPage type="sales_order" id={orderId} />
}
