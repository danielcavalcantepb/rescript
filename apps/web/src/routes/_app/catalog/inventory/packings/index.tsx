import { createFileRoute } from '@tanstack/react-router'
import { PackingsListPage } from '#/modules/inventory/ui/pages/packings-list-page'

export const Route = createFileRoute('/_app/catalog/inventory/packings/')({
  component: PackingsListPage,
})
