import { createFileRoute } from '@tanstack/react-router'
import { LocationsPage } from '#/modules/inventory/ui/pages/locations-page'

export const Route = createFileRoute('/_app/catalog/inventory/locations/')({
  component: LocationsPage,
})
