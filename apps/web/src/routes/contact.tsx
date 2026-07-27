import { createFileRoute } from '@tanstack/react-router'
import { marketingHead } from '#/modules/marketing/seo'
import { MarketingContactPage } from '#/modules/marketing/ui/marketing-pages'

export const Route = createFileRoute('/contact')({
  head: () =>
    marketingHead({
      title: 'Contato',
      description: 'Fale com a Rescript para conhecer o ERP que conecta toda a operação da sua empresa.',
      path: '/contact',
    }),
  component: MarketingContactPage,
})
