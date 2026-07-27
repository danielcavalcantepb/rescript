import { createFileRoute } from '@tanstack/react-router'
import { PickingsListPage } from '#/modules/inventory/ui/pages/pickings-list-page'

export const Route = createFileRoute('/_app/catalog/inventory/pickings/')({
  component: PickingsListPage,
})
