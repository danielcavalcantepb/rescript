import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/estoque/movimentacoes')({
  beforeLoad: () => {
    throw redirect({ to: '/catalog/inventory/movements' })
  },
})
