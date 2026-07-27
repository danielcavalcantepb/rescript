import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/payments')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/finance/payments', search })
  },
})
