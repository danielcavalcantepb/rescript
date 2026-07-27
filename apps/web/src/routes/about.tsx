import { createFileRoute } from '@tanstack/react-router'
import { marketingHead } from '#/modules/marketing/seo'
import { MarketingAboutPage } from '#/modules/marketing/ui/marketing-pages'

export const Route = createFileRoute('/about')({
  head: () =>
    marketingHead({
      title: 'Sobre',
      description: 'Conheça a Rescript, o ERP moderno que conecta toda a operação da empresa.',
      path: '/about',
    }),
  component: MarketingAboutPage,
})
