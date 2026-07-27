import { Outlet, createFileRoute } from '@tanstack/react-router'
import { RequirePermission } from '#/platform/permissions'

export const Route = createFileRoute('/_app/catalog')({
  component: CatalogLayoutRoute,
})

function CatalogLayoutRoute() {
  return (
    <RequirePermission
      permission="products.read"
      forbiddenDescription="Você não tem permissão para ver o catálogo."
    >
      <Outlet />
    </RequirePermission>
  )
}
