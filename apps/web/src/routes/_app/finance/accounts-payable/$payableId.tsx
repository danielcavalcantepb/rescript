import { createFileRoute } from '@tanstack/react-router'
import { PayableDetailPage } from '#/modules/payable/ui/pages/payable-detail-page'

export const Route = createFileRoute(
  '/_app/finance/accounts-payable/$payableId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { payableId } = Route.useParams()
  return <PayableDetailPage payableId={payableId} />
}
