import { createFileRoute } from '@tanstack/react-router'
import { LocationDetailsPage } from '#/modules/inventory/ui/pages/location-details-page'

export const Route = createFileRoute(
  '/_app/catalog/inventory/locations/$locationId',
)({
  component: LocationDetailsRoute,
})

function LocationDetailsRoute() {
  const { locationId } = Route.useParams()
  return <LocationDetailsPage locationId={locationId} />
}
