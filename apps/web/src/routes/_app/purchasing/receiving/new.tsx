import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/purchasing/receiving/new')({
  beforeLoad: () => {
    throw redirect({ to: '/procurement/receiving/new' })
  },
})
