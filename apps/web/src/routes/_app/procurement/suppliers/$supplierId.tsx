import { createFileRoute } from '@tanstack/react-router'
import { SupplierDetailPage } from '#/modules/suppliers/ui/pages/supplier-detail-page'

export const Route = createFileRoute('/_app/procurement/suppliers/$supplierId')({
  component: SupplierDetailRoute,
})

function SupplierDetailRoute() {
  const { supplierId } = Route.useParams()
  return <SupplierDetailPage supplierId={supplierId} />
}
