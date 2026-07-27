import { createFileRoute } from '@tanstack/react-router'
import { LocationCreatePage } from '#/modules/inventory/ui/pages/location-create-page'

export const Route = createFileRoute('/_app/catalog/inventory/locations/new')({
  component: LocationCreatePage,
})
