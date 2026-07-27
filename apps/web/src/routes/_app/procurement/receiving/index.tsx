import { createFileRoute } from '@tanstack/react-router'
import { ReceiptsListPage } from '#/modules/receiving/ui/pages/receipts-list-page'

export const Route = createFileRoute('/_app/procurement/receiving/')({
  component: ReceiptsListPage,
})
