import { createFileRoute } from '@tanstack/react-router'
import { InventoryItemCreatePage } from '#/modules/inventory/ui/pages/inventory-item-create-page'

export const Route = createFileRoute('/_app/catalog/inventory/items/new')({
  component: InventoryItemCreatePage,
})
