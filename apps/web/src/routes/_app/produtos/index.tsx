import { createFileRoute, redirect } from '@tanstack/react-router'

/** Compatibility route: Product management now lives in the Catalog workspace. */
export const Route = createFileRoute('/_app/produtos/')({
  beforeLoad: () => {
    throw redirect({ to: '/catalog/products' })
  },
})
