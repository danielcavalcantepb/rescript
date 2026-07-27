import { createFileRoute } from '@tanstack/react-router'
import { CheckoutPage } from '#/modules/checkout/ui/checkout-page'
import { marketingHead } from '#/modules/marketing/seo'

type CheckoutSearch = {
  plan?: string
  cycle?: string
}

export const Route = createFileRoute('/checkout')({
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => ({
    plan: typeof search.plan === 'string' ? search.plan : undefined,
    cycle: typeof search.cycle === 'string' ? search.cycle : undefined,
  }),
  head: () =>
    marketingHead({
      title: 'Checkout',
      description: 'Crie sua empresa na Rescript e inicie o onboarding operacional.',
      path: '/checkout',
    }),
  component: CheckoutRoute,
})

function CheckoutRoute() {
  const search = Route.useSearch()
  return <CheckoutPage initialPlan={search.plan} initialCycle={search.cycle} />
}
