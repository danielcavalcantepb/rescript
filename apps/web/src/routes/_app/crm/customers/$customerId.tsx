import { createFileRoute } from '@tanstack/react-router'
import { CustomerDetailPage } from '#/modules/customers/ui/pages/customer-detail-page'

export const Route = createFileRoute('/_app/crm/customers/$customerId')({
  component: CustomerDetailRoute,
})

function CustomerDetailRoute() {
  const { customerId } = Route.useParams()
  return <CustomerDetailPage customerId={customerId} />
}
