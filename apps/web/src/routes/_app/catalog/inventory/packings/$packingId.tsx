import { createFileRoute } from '@tanstack/react-router'
import { PackingDetailPage } from '#/modules/inventory/ui/pages/packing-detail-page'

export const Route = createFileRoute(
  '/_app/catalog/inventory/packings/$packingId',
)({
  component: () => {
    const { packingId } = Route.useParams()
    return <PackingDetailPage packingId={packingId} />
  },
})
