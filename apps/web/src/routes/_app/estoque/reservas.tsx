import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/estoque/reservas')({
  beforeLoad: () => {
    throw redirect({ to: '/catalog/inventory/reservations' })
  },
})
