import { createFileRoute, redirect } from '@tanstack/react-router'

/** Legacy path — Customer Aggregate lives under /crm/customers. */
export const Route = createFileRoute('/_app/clientes/')({
  beforeLoad: () => {
    throw redirect({ to: '/crm/customers' })
  },
})
