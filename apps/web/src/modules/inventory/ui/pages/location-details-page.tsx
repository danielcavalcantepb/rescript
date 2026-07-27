import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { CatalogStatusBadge } from '#/modules/catalog/ui/components/CatalogStatusBadge'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { CatalogLoadingState } from '#/modules/catalog/ui/loading/CatalogLoadingState'
import {
  useLocation,
  useLocationLifecycle,
} from '#/modules/inventory/ui/hooks/use-inventory-foundation'

export function LocationDetailsPage({ locationId }: { locationId: string }) {
  return (
    <RequirePermission
      permission="inventory.read"
      forbiddenDescription="Você não tem permissão para ver locais de estoque."
    >
      <LocationDetailsContent locationId={locationId} />
    </RequirePermission>
  )
}

function LocationDetailsContent({ locationId }: { locationId: string }) {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const query = useLocation(organizationId, locationId)
  const lifecycle = useLocationLifecycle(organizationId)

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }
  if (query.isLoading) {
    return (
      <CatalogShell title="Local">
        <CatalogLoadingState label="Carregando local…" />
      </CatalogShell>
    )
  }
  if (query.isError || !query.data) {
    return (
      <CatalogShell title="Local">
        <CatalogErrorState onRetry={() => void query.refetch()} />
      </CatalogShell>
    )
  }

  const location = query.data
  const busy =
    lifecycle.activate.isPending ||
    lifecycle.deactivate.isPending ||
    lifecycle.archive.isPending ||
    lifecycle.restore.isPending

  return (
    <CatalogShell
      title={location.name}
      description={`Código ${location.code}`}
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Estoque', href: '/catalog/inventory' },
        { label: 'Locais', href: '/catalog/inventory/locations' },
        { label: location.name },
      ]}
      actions={
        <Button
          type="button"
          variant="secondary"
          onClick={() => void navigate({ to: '/catalog/inventory/locations' })}
        >
          Voltar
        </Button>
      }
    >
      <dl className="grid max-w-xl gap-3 text-[13px] sm:grid-cols-2">
        <div>
          <dt className="text-[var(--color-text-secondary)]">Status</dt>
          <dd className="mt-1">
            <CatalogStatusBadge status={location.status} />
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-secondary)]">Prioridade</dt>
          <dd className="mt-1">{location.priority}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-secondary)]">Padrão</dt>
          <dd className="mt-1">{location.isDefault ? 'Sim' : 'Não'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[var(--color-text-secondary)]">Descrição</dt>
          <dd className="mt-1">{location.description || '—'}</dd>
        </div>
      </dl>

      <FeatureGate permission="inventory.locations.manage">
        <div className="mt-6 flex flex-wrap gap-2">
          {location.status !== 'active' ? (
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                void lifecycle.activate
                  .mutateAsync(location.id)
                  .then(() => notificationService.success('Local ativado'))
                  .catch((e: Error) => notificationService.error(e.message))
              }
            >
              Ativar
            </Button>
          ) : null}
          {location.status === 'active' && !location.isDefault ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void lifecycle.deactivate
                  .mutateAsync(location.id)
                  .then(() => notificationService.success('Local desativado'))
                  .catch((e: Error) => notificationService.error(e.message))
              }
            >
              Desativar
            </Button>
          ) : null}
          {location.status !== 'archived' && !location.isDefault ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void lifecycle.archive
                  .mutateAsync(location.id)
                  .then(() => notificationService.success('Local arquivado'))
                  .catch((e: Error) => notificationService.error(e.message))
              }
            >
              Arquivar
            </Button>
          ) : null}
          {location.status === 'archived' ? (
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                void lifecycle.restore
                  .mutateAsync(location.id)
                  .then(() =>
                    notificationService.success('Local restaurado (inativo)'),
                  )
                  .catch((e: Error) => notificationService.error(e.message))
              }
            >
              Restaurar
            </Button>
          ) : null}
        </div>
      </FeatureGate>
    </CatalogShell>
  )
}
