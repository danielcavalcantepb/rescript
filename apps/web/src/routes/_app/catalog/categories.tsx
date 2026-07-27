import { createFileRoute } from '@tanstack/react-router'
import { CatalogSectionPlaceholderPage } from '#/modules/catalog/ui/pages/catalog-section-placeholder-page'

export const Route = createFileRoute('/_app/catalog/categories')({
  component: CatalogCategoriesPage,
})

function CatalogCategoriesPage() {
  return (
    <CatalogSectionPlaceholderPage
      title="Categorias"
      breadcrumbLabel="Categorias"
      description="Navegação do módulo Catalog — listagem em sprint futura."
    />
  )
}
