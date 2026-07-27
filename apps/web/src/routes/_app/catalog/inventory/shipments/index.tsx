import { createFileRoute } from '@tanstack/react-router'
import { ShipmentsListPage } from '#/modules/inventory/ui/pages/shipments-list-page'

export const Route = createFileRoute('/_app/catalog/inventory/shipments/')({
  component: ShipmentsListPage,
})
