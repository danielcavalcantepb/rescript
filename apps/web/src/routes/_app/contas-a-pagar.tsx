import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contas-a-pagar')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/finance/accounts-payable', search })
  },
})
