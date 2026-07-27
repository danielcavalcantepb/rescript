import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/procurement/')({
  beforeLoad: () => {
    throw redirect({ to: '/procurement/purchases' })
  },
})
