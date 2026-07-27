import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission } from '#/platform/permissions'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { CatalogStatusBadge } from '#/modules/catalog/ui/components/CatalogStatusBadge'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { CatalogLoadingState } from '#/modules/catalog/ui/loading/CatalogLoadingState'
import { useInventoryItem } from '#/modules/inventory/ui/hooks/use-inventory-foundation'

export function InventoryItemDetailsPage({
  inventoryItemId,
}: {
  inventoryItemId: string
}) {
  return (
    <RequirePermission
      permission="inventory.read"
      forbiddenDescription="Você não tem permissão para ver estoque."
    >
      <InventoryItemDetailsContent inventoryItemId={inventoryItemId} />
    </RequirePermission>
  )
}

function InventoryItemDetailsContent({
  inventoryItemId,
}: {
  inventoryItemId: string
}) {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const query = useInventoryItem(organizationId, inventoryItemId)

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }
  if (query.isLoading) {
    return (
      <CatalogShell title="Item de estoque">
        <CatalogLoadingState label="Carregando item…" />
      </CatalogShell>
    )
  }
  if (query.isError || !query.data) {
    return (
      <CatalogShell title="Item de estoque">
        <CatalogErrorState onRetry={() => void query.refetch()} />
      </CatalogShell>
    )
  }

  const item = query.data

  return (
    <CatalogShell
      title="Item de estoque"
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Estoque', href: '/catalog/inventory' },
        { label: 'Itens', href: '/catalog/inventory/items' },
        { label: 'Detalhes' },
      ]}
      actions={
        <div className="flex flex-wrap gap-2">
          <FeatureGate permission="inventory.movements.create">
            <Button
              type="button"
              onClick={() =>
                void navigate({
                  to: '/catalog/inventory/movements/new',
                  search: { kind: 'entry' },
                })
              }
            >
              Registrar movimento
            </Button>
          </FeatureGate>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void navigate({ to: '/catalog/inventory/items' })}
          >
            Voltar
          </Button>
        </div>
      }
    >
      <dl className="grid max-w-xl gap-3 text-[13px] sm:grid-cols-2">
        <div>
          <dt className="text-[var(--color-text-secondary)]">Status</dt>
          <dd className="mt-1">
            <CatalogStatusBadge status={item.status} />
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-secondary)]">
            Quantidade projetada (disponível)
          </dt>
          <dd className="mt-1">{item.quantityAvailable}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-secondary)]">On hand</dt>
          <dd className="mt-1">{item.quantityOnHand}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-secondary)]">Reservado</dt>
          <dd className="mt-1">{item.quantityReserved}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[var(--color-text-secondary)]">Variant</dt>
          <dd className="mt-1 font-mono text-[12px]">{item.variantId}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-[var(--color-text-secondary)]">Local</dt>
          <dd className="mt-1 font-mono text-[12px]">{item.locationId}</dd>
        </div>
      </dl>

      <p className="mt-4 max-w-xl text-[13px] text-[var(--color-text-secondary)]">
        O saldo é projetado pelo ledger. Para alterar quantidade, registre um
        movimento.
      </p>
    </CatalogShell>
  )
}
