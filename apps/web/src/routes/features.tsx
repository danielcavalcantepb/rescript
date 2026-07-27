import { createFileRoute } from '@tanstack/react-router'
import { marketingHead } from '#/modules/marketing/seo'
import { MarketingFeaturesPage } from '#/modules/marketing/ui/marketing-pages'

export const Route = createFileRoute('/features')({
  head: () =>
    marketingHead({
      title: 'Recursos',
      description: 'Recursos da Rescript para conectar operação, contexto, auditoria e produtividade em uma única plataforma.',
      path: '/features',
    }),
  component: MarketingFeaturesPage,
})
