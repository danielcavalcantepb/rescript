import { createFileRoute } from '@tanstack/react-router'
import { InventoryItemDetailsPage } from '#/modules/inventory/ui/pages/inventory-item-details-page'

export const Route = createFileRoute(
  '/_app/catalog/inventory/items/$inventoryItemId',
)({
  component: InventoryItemDetailsRoute,
})

function InventoryItemDetailsRoute() {
  const { inventoryItemId } = Route.useParams()
  return <InventoryItemDetailsPage inventoryItemId={inventoryItemId} />
}
