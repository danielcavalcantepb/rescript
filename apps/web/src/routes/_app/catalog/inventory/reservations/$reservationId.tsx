import { createFileRoute } from '@tanstack/react-router'
import { ReservationDetailPage } from '#/modules/inventory/ui/pages/reservation-detail-page'

export const Route = createFileRoute(
  '/_app/catalog/inventory/reservations/$reservationId',
)({
  component: ReservationDetailRoute,
})

function ReservationDetailRoute() {
  const { reservationId } = Route.useParams()
  return <ReservationDetailPage reservationId={reservationId} />
}
