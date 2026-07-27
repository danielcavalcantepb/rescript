import { createFileRoute } from '@tanstack/react-router'
import { ReservationsListPage } from '#/modules/inventory/ui/pages/reservations-list-page'

export const Route = createFileRoute('/_app/catalog/inventory/reservations/')({
  component: ReservationsListPage,
})
