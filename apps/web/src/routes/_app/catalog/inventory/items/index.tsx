import { createFileRoute } from '@tanstack/react-router'
import { InventoryItemsPage } from '#/modules/inventory/ui/pages/inventory-items-page'

export const Route = createFileRoute('/_app/catalog/inventory/items/')({
  component: InventoryItemsPage,
})
