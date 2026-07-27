import { createFileRoute } from '@tanstack/react-router'
import { marketingHead } from '#/modules/marketing/seo'
import { MarketingModulesPage } from '#/modules/marketing/ui/marketing-pages'

export const Route = createFileRoute('/modules')({
  head: () =>
    marketingHead({
      title: 'Módulos',
      description: 'Módulos da Rescript para CRM, vendas, compras, estoque, produção, financeiro e indicadores.',
      path: '/modules',
    }),
  component: MarketingModulesPage,
})
