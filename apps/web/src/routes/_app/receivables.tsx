import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/receivables')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/finance/receivables', search })
  },
})
