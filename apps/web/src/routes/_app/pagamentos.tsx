import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/pagamentos')({
  beforeLoad: ({ search }) => {
    throw redirect({ to: '/finance/payments', search })
  },
})
