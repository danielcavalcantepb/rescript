import { createFileRoute } from '@tanstack/react-router'
import { CatalogSectionPlaceholderPage } from '#/modules/catalog/ui/pages/catalog-section-placeholder-page'

export const Route = createFileRoute('/_app/catalog/brands')({
  component: CatalogBrandsPage,
})

function CatalogBrandsPage() {
  return (
    <CatalogSectionPlaceholderPage
      title="Marcas"
      breadcrumbLabel="Marcas"
      description="Navegação do módulo Catalog — listagem em sprint futura."
    />
  )
}
