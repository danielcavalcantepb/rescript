import { createFileRoute } from '@tanstack/react-router'
import { marketingHead } from '#/modules/marketing/seo'
import { MarketingCustomersPage } from '#/modules/marketing/ui/marketing-pages'

export const Route = createFileRoute('/customers')({
  head: () =>
    marketingHead({
      title: 'Clientes',
      description: 'Histórias reais e clientes da Rescript, com estrutura preparada para estudos de caso autorizados.',
      path: '/customers',
    }),
  component: MarketingCustomersPage,
})
