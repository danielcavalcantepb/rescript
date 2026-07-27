import { createFileRoute } from '@tanstack/react-router'
import { SuppliersListPage } from '#/modules/suppliers/ui/pages/suppliers-list-page'

export const Route = createFileRoute('/_app/procurement/suppliers/')({
  component: SuppliersListPage,
})
