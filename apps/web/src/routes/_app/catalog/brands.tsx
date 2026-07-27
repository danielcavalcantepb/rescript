import { createFileRoute } from '@tanstack/react-router'
import { CatalogBrandsPage } from '#/modules/catalog/ui/pages/catalog-taxonomy-pages'

export const Route = createFileRoute('/_app/catalog/brands')({
  component: CatalogBrandsPage,
})
