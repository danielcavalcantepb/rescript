import { createFileRoute } from '@tanstack/react-router'
import { CustomersListPage } from '#/modules/customers/ui/pages/customers-list-page'

export const Route = createFileRoute('/_app/crm/customers/')({
  component: CustomersListPage,
})
