import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission } from '#/platform/permissions'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { CatalogStatusBadge } from '#/modules/catalog/ui/components/CatalogStatusBadge'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'
import { CatalogEmptyState } from '#/modules/catalog/ui/empty-states/CatalogEmptyState'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { CatalogLoadingState } from '#/modules/catalog/ui/loading/CatalogLoadingState'
import { useLocations } from '#/modules/inventory/ui/hooks/use-inventory-foundation'

export function LocationsPage() {
  return (
    <RequirePermission
      permission="inventory.read"
      forbiddenDescription="Você não tem permissão para ver locais de estoque."
    >
      <LocationsContent />
    </RequirePermission>
  )
}

function LocationsContent() {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const orgActive = currentOrganization?.status === 'active'
  const query = useLocations(
    organizationId,
    Boolean(organizationId) && orgActive,
  )

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  return (
    <CatalogShell
      title="Locais de estoque"
      description="Stock Locations da Inventory Foundation."
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Estoque', href: '/catalog/inventory' },
        { label: 'Locais' },
      ]}
      actions={
        <FeatureGate permission="inventory.locations.manage">
          <Button
            type="button"
            onClick={() =>
              void navigate({ to: '/catalog/inventory/locations/new' })
            }
          >
            Novo local
          </Button>
        </FeatureGate>
      }
    >
      <CatalogToolbar title="Locais" />
      {query.isLoading ? (
        <CatalogLoadingState label="Carregando locais…" />
      ) : null}
      {query.isError ? (
        <CatalogErrorState onRetry={() => void query.refetch()} />
      ) : null}
      {query.data && query.data.length === 0 ? (
        <CatalogEmptyState
          title="Nenhum local de estoque"
          description="Crie o local padrão da organização para iniciar o estoque por variante."
          action={
            <FeatureGate permission="inventory.locations.manage">
              <Button
                type="button"
                onClick={() =>
                  void navigate({ to: '/catalog/inventory/locations/new' })
                }
              >
                Criar local padrão
              </Button>
            </FeatureGate>
          }
        />
      ) : null}
      {query.data && query.data.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-soft)]">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Código</th>
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Prioridade</th>
                <th className="px-3 py-2 font-medium">Padrão</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((location) => (
                <tr
                  key={location.id}
                  className="border-b border-[var(--color-border-soft)] last:border-0"
                >
                  <td className="px-3 py-2 font-mono text-[12px]">
                    {location.code}
                  </td>
                  <td className="px-3 py-2">{location.name}</td>
                  <td className="px-3 py-2">{location.priority}</td>
                  <td className="px-3 py-2">
                    {location.isDefault ? 'Sim' : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <CatalogStatusBadge status={location.status} />
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        void navigate({
                          to: '/catalog/inventory/locations/$locationId',
                          params: { locationId: location.id },
                        })
                      }
                    >
                      Detalhes
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </CatalogShell>
  )
}
