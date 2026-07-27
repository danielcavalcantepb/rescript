import { createFileRoute } from '@tanstack/react-router'
import { InventoryHomePage } from '#/modules/inventory/ui/pages/inventory-home-page'

export const Route = createFileRoute('/_app/catalog/inventory/')({
  component: InventoryHomePage,
})
