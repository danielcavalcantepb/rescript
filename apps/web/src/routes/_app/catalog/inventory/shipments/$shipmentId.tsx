import { createFileRoute } from '@tanstack/react-router'
import { ShipmentDetailPage } from '#/modules/inventory/ui/pages/shipment-detail-page'

export const Route = createFileRoute(
  '/_app/catalog/inventory/shipments/$shipmentId',
)({
  component: () => {
    const { shipmentId } = Route.useParams()
    return <ShipmentDetailPage shipmentId={shipmentId} />
  },
})
