import { createFileRoute } from '@tanstack/react-router'
import { SalesFormPage } from '#/modules/sales/ui/pages/sales-form-page'

export const Route = createFileRoute('/_app/sales/quotations/$quotationId/edit')({
  component: RoutePage,
})

function RoutePage() {
  const { quotationId } = Route.useParams()
  return <SalesFormPage type="quotation" id={quotationId} />
}
