import { createFileRoute } from '@tanstack/react-router'
import { MovementsPage } from '#/modules/inventory/ui/pages/movements-page'

export const Route = createFileRoute('/_app/catalog/inventory/movements/')({
  component: MovementsPage,
})
