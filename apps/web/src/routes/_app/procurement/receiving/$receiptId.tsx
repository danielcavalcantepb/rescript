import { createFileRoute } from '@tanstack/react-router'
import { ReceiptDetailPage } from '#/modules/receiving/ui/pages/receipt-detail-page'

export const Route = createFileRoute('/_app/procurement/receiving/$receiptId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { receiptId } = Route.useParams()
  return <ReceiptDetailPage receiptId={receiptId} />
}
