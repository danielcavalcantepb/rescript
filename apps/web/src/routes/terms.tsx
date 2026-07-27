import { createFileRoute } from '@tanstack/react-router'
import { marketingHead } from '#/modules/marketing/seo'
import { MarketingTermsPage } from '#/modules/marketing/ui/marketing-pages'

export const Route = createFileRoute('/terms')({
  head: () =>
    marketingHead({
      title: 'Termos',
      description: 'Página institucional de termos de uso da Rescript.',
      path: '/terms',
    }),
  component: MarketingTermsPage,
})
