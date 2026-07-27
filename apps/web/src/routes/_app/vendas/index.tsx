import { createFileRoute, redirect } from '@tanstack/react-router'

// Legacy route kept only as a temporary compatibility redirect.
// Operational Sales navigation must use /sales/orders or /sales/quotations.
export const Route = createFileRoute('/_app/vendas/')({
  beforeLoad: () => {
    throw redirect({ to: '/sales/orders' })
  },
})
