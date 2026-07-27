import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission, usePermission } from '#/platform/permissions'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { CatalogStatusBadge } from '#/modules/catalog/ui/components/CatalogStatusBadge'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'
import { CatalogEmptyState } from '#/modules/catalog/ui/empty-states/CatalogEmptyState'
import { usePriceLists } from '#/modules/catalog/ui/hooks/use-catalog-pricing'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { CatalogLoadingState } from '#/modules/catalog/ui/loading/CatalogLoadingState'
export function PriceListsPage() {
  return (
    <RequirePermission
      permission="prices.read"
      forbiddenDescription="Você não tem permissão para ver listas de preço."
    >
      <PriceListsContent />
    </RequirePermission>
  )
}

function PriceListsContent() {
  const navigate = useNavigate()
  const { can } = usePermission()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const orgActive = currentOrganization?.status === 'active'
  const query = usePriceLists(
    organizationId,
    Boolean(organizationId) && orgActive,
  )

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  return (
    <CatalogShell
      title="Listas de preço"
      description="Price Engine do catálogo — listas, vigência e resolução."
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Listas de preço' },
      ]}
      actions={
        <FeatureGate permission="prices.create">
          <Button
            type="button"
            disabled={!can('prices.create') && !can('products.write')}
            onClick={() =>
              void navigate({ to: '/catalog/price-lists/new' })
            }
          >
            Nova lista
          </Button>
        </FeatureGate>
      }
    >
      <CatalogToolbar title="Listas" />
      {query.isLoading ? <CatalogLoadingState label="Carregando listas…" /> : null}
      {query.isError ? (
        <CatalogErrorState onRetry={() => void query.refetch()} />
      ) : null}
      {query.data && query.data.length === 0 ? (
        <CatalogEmptyState
          title="Nenhuma lista de preço"
          description="Crie a lista padrão da organização para precificar variantes."
          action={
            <FeatureGate permission="prices.create">
              <Button
                type="button"
                onClick={() =>
                  void navigate({ to: '/catalog/price-lists/new' })
                }
              >
                Criar lista padrão
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
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Moeda</th>
                <th className="px-3 py-2 font-medium">Prioridade</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Entradas</th>
                <th className="px-3 py-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((list) => (
                <tr
                  key={list.id}
                  className="border-b border-[var(--color-border-soft)] last:border-0"
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-[var(--color-ink)]">
                      {list.name}
                      {list.isDefault ? (
                        <span className="ml-2 text-[12px] text-[var(--color-text-secondary)]">
                          (padrão)
                        </span>
                      ) : null}
                    </div>
                    {list.description ? (
                      <div className="text-[12px] text-[var(--color-text-secondary)]">
                        {list.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 font-mono">{list.currency}</td>
                  <td className="px-3 py-2 font-mono">{list.priority}</td>
                  <td className="px-3 py-2">
                    <CatalogStatusBadge status={list.status} />
                  </td>
                  <td className="px-3 py-2 font-mono">{list.entryCount}</td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        void navigate({
                          to: '/catalog/price-lists/$priceListId',
                          params: { priceListId: list.id },
                        })
                      }
                    >
                      Abrir
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
