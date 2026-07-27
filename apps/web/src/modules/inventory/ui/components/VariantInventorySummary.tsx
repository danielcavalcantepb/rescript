import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { FeatureGate } from '#/platform/permissions'
import { CatalogLoadingState } from '#/modules/catalog/ui/loading/CatalogLoadingState'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import {
  useMovements,
  useVariantInventorySummary,
} from '#/modules/inventory/ui/hooks/use-inventory-foundation'

/** Read-only inventory summary — quantities from ledger projection. */
export function VariantInventorySummary({
  organizationId,
  variantId,
}: {
  organizationId: string
  variantId: string
}) {
  const navigate = useNavigate()
  const query = useVariantInventorySummary(organizationId, variantId)
  const movements = useMovements(organizationId, {
    variantId,
    limit: 1,
  })

  if (query.isLoading) {
    return <CatalogLoadingState label="Carregando estoque…" />
  }
  if (query.isError) {
    return <CatalogErrorState onRetry={() => void query.refetch()} />
  }
  if (!query.data) return null

  const { defaultLocation, item, availability } = query.data
  const last = movements.data?.[0]

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] p-4">
      <h3 className="text-[14px] font-medium text-[var(--color-ink)]">
        Resumo de estoque
      </h3>
      {defaultLocation ? (
        <p className="mt-2 text-[14px] text-[var(--color-ink)]">
          Local padrão:{' '}
          <strong>
            {defaultLocation.name} ({defaultLocation.code})
          </strong>
        </p>
      ) : (
        <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
          Nenhum local padrão configurado.
        </p>
      )}
      <p className="mt-1 text-[14px]">
        On Hand: <strong>{item?.quantityOnHand ?? 0}</strong>
      </p>
      <p className="mt-1 text-[14px]">
        Reservado: <strong>{item?.quantityReserved ?? 0}</strong>
      </p>
      <p className="mt-1 text-[14px]">
        Disponível:{' '}
        <strong>
          {availability?.quantityAvailable ?? item?.quantityAvailable ?? 0}
        </strong>
      </p>
      {last ? (
        <p className="mt-2 text-[12px] text-[var(--color-text-secondary)]">
          Último movimento: {last.type} ({last.quantity}) — {last.reason}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <FeatureGate permission="inventory.read">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void navigate({ to: '/catalog/inventory' })}
          >
            Gerenciar estoque
          </Button>
        </FeatureGate>
        <FeatureGate permission="inventory.movements.read">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              void navigate({ to: '/catalog/inventory/movements' })
            }
          >
            Histórico
          </Button>
        </FeatureGate>
      </div>
    </div>
  )
}
