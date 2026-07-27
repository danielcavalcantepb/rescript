import { createFileRoute } from '@tanstack/react-router'
import { marketingHead } from '#/modules/marketing/seo'
import { MarketingStatusPage } from '#/modules/marketing/ui/marketing-pages'

export const Route = createFileRoute('/status')({
  head: () =>
    marketingHead({
      title: 'Status',
      description: 'Página pública de status da Rescript, preparada para monitoramento futuro.',
      path: '/status',
    }),
  component: MarketingStatusPage,
})
