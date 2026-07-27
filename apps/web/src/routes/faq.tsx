import { createFileRoute } from '@tanstack/react-router'
import { marketingHead } from '#/modules/marketing/seo'
import { MarketingFaqPage } from '#/modules/marketing/ui/marketing-pages'

export const Route = createFileRoute('/faq')({
  head: () =>
    marketingHead({
      title: 'FAQ',
      description: 'Perguntas frequentes sobre a Rescript, sua proposta e seu escopo institucional.',
      path: '/faq',
    }),
  component: MarketingFaqPage,
})
