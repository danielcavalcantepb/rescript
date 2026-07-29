import { createFileRoute } from '@tanstack/react-router'
import { PaymentSettingsPage } from '#/modules/sales/ui/pages/payment-settings-page'

export const Route = createFileRoute('/_app/finance/payment-settings')({
  component: PaymentSettingsPage,
})
