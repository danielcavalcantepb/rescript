import { createFileRoute, redirect } from '@tanstack/react-router'

// Legacy route kept only as a temporary compatibility redirect.
// Unknown legacy ids resolve to the canonical Sales Orders workspace.
export const Route = createFileRoute('/_app/vendas/$saleId')({
  beforeLoad: ({ params }) => {
    if (!/^[0-9a-fA-F-]{36}$/.test(params.saleId)) {
      throw redirect({ to: '/sales/orders' })
    }
    throw redirect({ to: '/sales/orders/$orderId', params: { orderId: params.saleId } })
  },
})
