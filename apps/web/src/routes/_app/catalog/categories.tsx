import { createFileRoute } from '@tanstack/react-router'
import { CatalogCategoriesPage } from '#/modules/catalog/ui/pages/catalog-taxonomy-pages'

export const Route = createFileRoute('/_app/catalog/categories')({
  component: CatalogCategoriesPage,
})
