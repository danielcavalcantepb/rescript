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
import { useInventory } from '#/modules/inventory/ui/hooks/use-inventory-foundation'

export function InventoryItemsPage() {
  return (
    <RequirePermission
      permission="inventory.read"
      forbiddenDescription="Você não tem permissão para ver estoque."
    >
      <InventoryItemsContent />
    </RequirePermission>
  )
}

function InventoryItemsContent() {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const orgActive = currentOrganization?.status === 'active'
  const query = useInventory(
    organizationId,
    undefined,
    Boolean(organizationId) && orgActive,
  )

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  return (
    <CatalogShell
      title="Itens de estoque"
      description="Posição de estoque por variante e local."
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Estoque', href: '/estoque' },
        { label: 'Estoque', href: '/catalog/inventory' },
        { label: 'Itens' },
      ]}
      actions={
        <FeatureGate permission="inventory.create">
          <Button
            type="button"
            onClick={() =>
              void navigate({ to: '/catalog/inventory/items/new' })
            }
          >
            Novo item
          </Button>
        </FeatureGate>
      }
    >
      <CatalogToolbar title="Itens de estoque" />
      {query.isLoading ? (
        <CatalogLoadingState label="Carregando itens…" />
      ) : null}
      {query.isError ? (
        <CatalogErrorState onRetry={() => void query.refetch()} />
      ) : null}
      {query.data && query.data.length === 0 ? (
        <CatalogEmptyState
          title="Nenhum item de estoque"
          description="Crie um item vinculando variante e local. Quantidade reservada permanece 0 até reservas."
          action={
            <FeatureGate permission="inventory.create">
              <Button
                type="button"
                onClick={() =>
                  void navigate({ to: '/catalog/inventory/items/new' })
                }
              >
                Criar item
              </Button>
            </FeatureGate>
          }
        />
      ) : null}
      {query.data && query.data.length > 0 ? (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-soft)]">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Variante</th>
                <th className="px-3 py-2 font-medium">Local</th>
                <th className="px-3 py-2 font-medium">On hand</th>
                <th className="px-3 py-2 font-medium">Reservado</th>
                <th className="px-3 py-2 font-medium">Disponível</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--color-border-soft)] last:border-0"
                >
                  <td className="px-3 py-2 font-mono text-[12px]">
                    {item.variantId.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-2 font-mono text-[12px]">
                    {item.locationId.slice(0, 8)}…
                  </td>
                  <td className="px-3 py-2">{item.quantityOnHand}</td>
                  <td className="px-3 py-2">{item.quantityReserved}</td>
                  <td className="px-3 py-2">{item.quantityAvailable}</td>
                  <td className="px-3 py-2">
                    <CatalogStatusBadge status={item.status} />
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        void navigate({
                          to: '/catalog/inventory/items/$inventoryItemId',
                          params: { inventoryItemId: item.id },
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
