import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/contas-a-receber')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/finance/receivables', search })
  },
})
