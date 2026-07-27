import { createFileRoute } from '@tanstack/react-router'
import { marketingHead } from '#/modules/marketing/seo'
import { MarketingPricingPage } from '#/modules/marketing/ui/marketing-pages'

export const Route = createFileRoute('/pricing')({
  head: () =>
    marketingHead({
      title: 'Planos',
      description: 'Planos da Rescript com checkout de criação de empresa e onboarding inicial.',
      path: '/pricing',
    }),
  component: MarketingPricingPage,
})
