import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/accounts-payable')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/finance/accounts-payable', search })
  },
})
