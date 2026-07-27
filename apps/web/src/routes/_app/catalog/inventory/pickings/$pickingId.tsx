import { createFileRoute } from '@tanstack/react-router'
import { PickingDetailPage } from '#/modules/inventory/ui/pages/picking-detail-page'

export const Route = createFileRoute(
  '/_app/catalog/inventory/pickings/$pickingId',
)({
  component: () => {
    const { pickingId } = Route.useParams()
    return <PickingDetailPage pickingId={pickingId} />
  },
})
