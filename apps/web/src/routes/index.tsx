import { createFileRoute } from '@tanstack/react-router'
import { marketingSite } from '#/modules/marketing/content'
import { marketingHead } from '#/modules/marketing/seo'
import { MarketingHomePage } from '#/modules/marketing/ui/marketing-pages'

export const Route = createFileRoute('/')({
  head: () =>
    marketingHead({
      title: marketingSite.name,
      description: marketingSite.description,
      path: '/',
    }),
  component: MarketingHomePage,
})
