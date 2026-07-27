import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/finance/')({
  beforeLoad: () => {
    throw redirect({ to: '/finance/accounts-payable' })
  },
})
