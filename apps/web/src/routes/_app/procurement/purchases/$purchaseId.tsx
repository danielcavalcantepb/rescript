import { createFileRoute } from '@tanstack/react-router'
import { PurchaseDetailPage } from '#/modules/purchase/ui/pages/purchase-detail-page'

export const Route = createFileRoute('/_app/procurement/purchases/$purchaseId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { purchaseId } = Route.useParams()
  return <PurchaseDetailPage purchaseId={purchaseId} />
}
