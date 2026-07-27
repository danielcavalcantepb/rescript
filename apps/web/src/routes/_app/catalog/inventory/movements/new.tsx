import { createFileRoute } from '@tanstack/react-router'
import {
  MovementCreatePage,
  parseMovementCreateKind,
} from '#/modules/inventory/ui/pages/movement-create-page'

export const Route = createFileRoute('/_app/catalog/inventory/movements/new')({
  validateSearch: (search: Record<string, unknown>) => ({
    kind: parseMovementCreateKind(search.kind),
  }),
  component: MovementCreateRoute,
})

function MovementCreateRoute() {
  const { kind } = Route.useSearch()
  return <MovementCreatePage kind={kind} />
}
