import { createFileRoute } from '@tanstack/react-router'
import { marketingHead } from '#/modules/marketing/seo'
import { MarketingPrivacyPage } from '#/modules/marketing/ui/marketing-pages'

export const Route = createFileRoute('/privacy')({
  head: () =>
    marketingHead({
      title: 'Privacidade',
      description: 'Página institucional de privacidade da Rescript.',
      path: '/privacy',
    }),
  component: MarketingPrivacyPage,
})
