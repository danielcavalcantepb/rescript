import type { ReactNode } from 'react'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { PageHeader } from '#/components/PageHeader'
import { CatalogModuleNav } from '#/modules/catalog/ui/layouts/CatalogModuleNav'

export function CatalogShell({
  title,
  description,
  breadcrumb,
  actions,
  children,
}: {
  title: string
  description?: string
  breadcrumb?: Array<{ label: string; href?: string }>
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div>
      {breadcrumb && breadcrumb.length > 0 ? (
        <AppBreadcrumb items={breadcrumb} />
      ) : null}
      <PageHeader title={title} description={description} actions={actions} />
      <CatalogModuleNav />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
