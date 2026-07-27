import { createFileRoute } from '@tanstack/react-router'
import { CatalogHomePage } from '#/modules/catalog/ui/pages/catalog-home-page'

export const Route = createFileRoute('/_app/catalog/')({
  component: CatalogHomePage,
})
