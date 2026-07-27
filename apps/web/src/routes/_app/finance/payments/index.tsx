import { createFileRoute } from '@tanstack/react-router'
import { PaymentsListPage } from '#/modules/payments/ui/pages/payments-list-page'
export const Route=createFileRoute('/_app/finance/payments/')({component:PaymentsListPage})
