import { createFileRoute } from '@tanstack/react-router'
import { CatalogAttributesPage } from '#/modules/catalog/ui/pages/catalog-attributes-page'

export const Route = createFileRoute('/_app/catalog/attributes')({
  component: CatalogAttributesPage,
})
