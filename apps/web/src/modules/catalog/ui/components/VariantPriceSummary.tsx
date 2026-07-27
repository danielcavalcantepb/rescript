import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { FeatureGate } from '#/platform/permissions'
import { CatalogLoadingState } from '#/modules/catalog/ui/loading/CatalogLoadingState'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { usePricesByVariant } from '#/modules/catalog/ui/hooks/use-catalog-pricing'
import { formatMoneyDisplay } from '#/modules/catalog/domain/value-objects/money'
import type { MoneyCurrency } from '#/modules/catalog/domain/value-objects/money'

/** Read-only price summary for a Variant — resolution happens server-side. */
export function VariantPriceSummary({
  organizationId,
  variantId,
}: {
  organizationId: string
  variantId: string
}) {
  const navigate = useNavigate()
  const query = usePricesByVariant(organizationId, variantId)

  if (query.isLoading) {
    return <CatalogLoadingState label="Carregando preço…" />
  }
  if (query.isError) {
    return <CatalogErrorState onRetry={() => void query.refetch()} />
  }
  if (!query.data) return null

  const resolved = query.data.resolved
  const defaultList = query.data.lists.find((l) => l.isDefault)

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] p-4">
      <h3 className="text-[14px] font-medium text-[var(--color-ink)]">
        Resumo de preço
      </h3>
      {resolved ? (
        <p className="mt-2 text-[14px] text-[var(--color-ink)]">
          Preço padrão:{' '}
          <strong>
            {formatMoneyDisplay({
              currency: resolved.currency as MoneyCurrency,
              amount: resolved.amount,
            })}
          </strong>
          <span className="ml-2 text-[13px] text-[var(--color-text-secondary)]">
            Lista: {resolved.priceListName}
          </span>
        </p>
      ) : (
        <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
          Sem preço efetivo
          {defaultList ? ` na lista ${defaultList.priceListName}` : ''}.
        </p>
      )}
      <div className="mt-3">
        <FeatureGate permission="prices.read">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void navigate({ to: '/catalog/price-lists' })}
          >
            Gerenciar preços
          </Button>
        </FeatureGate>
      </div>
    </div>
  )
}
