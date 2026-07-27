import { createFileRoute } from '@tanstack/react-router'
import { CatalogSectionPlaceholderPage } from '#/modules/catalog/ui/pages/catalog-section-placeholder-page'

export const Route = createFileRoute('/_app/catalog/attributes')({
  component: CatalogAttributesPage,
})

function CatalogAttributesPage() {
  return (
    <CatalogSectionPlaceholderPage
      title="Atributos"
      breadcrumbLabel="Atributos"
      description="Navegação do módulo Catalog — listagem em sprint futura."
    />
  )
}
