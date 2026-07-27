import { createFileRoute } from '@tanstack/react-router'
import { PayablesListPage } from '#/modules/payable/ui/pages/payables-list-page'

export const Route = createFileRoute('/_app/finance/accounts-payable/')({
  component: PayablesListPage,
})
