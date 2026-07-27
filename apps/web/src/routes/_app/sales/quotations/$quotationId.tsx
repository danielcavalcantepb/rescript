import { createFileRoute } from '@tanstack/react-router'
import { SalesDocumentPage } from '#/modules/sales/ui/pages/sales-document-page'

export const Route = createFileRoute('/_app/sales/quotations/$quotationId')({
  component: RoutePage,
})

function RoutePage() {
  const { quotationId } = Route.useParams()
  return <SalesDocumentPage type="quotation" id={quotationId} />
}
