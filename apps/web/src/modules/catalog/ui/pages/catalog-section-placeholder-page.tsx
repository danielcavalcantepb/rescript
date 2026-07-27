import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'
import { CatalogEmptyState } from '#/modules/catalog/ui/empty-states/CatalogEmptyState'

export function CatalogSectionPlaceholderPage({
  title,
  description,
  breadcrumbLabel,
}: {
  title: string
  description: string
  breadcrumbLabel: string
}) {
  return (
    <CatalogShell
      title={title}
      description={description}
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: breadcrumbLabel },
      ]}
    >
      <CatalogToolbar
        title={title}
        description="Shell pronto. CRUD e editores entram em sprints futuras."
      />
      <CatalogEmptyState
        title="Em breve"
        description="Esta área do catálogo ainda não tem listagem nesta sprint."
      />
    </CatalogShell>
  )
}
