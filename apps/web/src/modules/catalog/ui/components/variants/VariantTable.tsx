import { Button } from '#/components/ui/button'
import type { VariantResponse } from '#/modules/catalog/application'
import {
  VariantCombinationLabel,
  VariantStatusBadge,
} from '#/modules/catalog/ui/components/variants/variant-ui-primitives'

export function VariantTable({
  items,
  canEdit,
  canArchive,
  canRestore,
  onEditSku,
  onArchive,
  onRestore,
  busyVariantId,
}: {
  items: VariantResponse[]
  canEdit: boolean
  canArchive: boolean
  canRestore: boolean
  onEditSku: (variant: VariantResponse) => void
  onArchive: (variant: VariantResponse) => void
  onRestore: (variant: VariantResponse) => void
  busyVariantId?: string | null
}) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border-soft)]">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <thead className="border-b border-[var(--color-border-soft)] bg-[var(--color-surface-muted)]">
          <tr>
            <th className="px-3 py-2 font-medium text-[var(--color-ink)]">
              Combinação
            </th>
            <th className="px-3 py-2 font-medium text-[var(--color-ink)]">SKU</th>
            <th className="px-3 py-2 font-medium text-[var(--color-ink)]">
              Código de barras
            </th>
            <th className="px-3 py-2 font-medium text-[var(--color-ink)]">
              Status
            </th>
            <th className="px-3 py-2 font-medium text-[var(--color-ink)]">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((variant) => {
            const busy = busyVariantId === variant.id
            return (
              <tr
                key={variant.id}
                className="border-b border-[var(--color-border-soft)] last:border-0"
              >
                <td className="px-3 py-2 text-[var(--color-ink)]">
                  <VariantCombinationLabel
                    label={variant.combinationLabel}
                    isDefault={variant.isDefault}
                  />
                </td>
                <td className="px-3 py-2 font-mono text-[var(--color-ink)]">
                  {variant.sku ?? '—'}
                </td>
                <td className="px-3 py-2 font-mono text-[var(--color-ink)]">
                  {variant.primaryBarcode ?? '—'}
                </td>
                <td className="px-3 py-2">
                  <VariantStatusBadge status={variant.status} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {canEdit && variant.status !== 'archived' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => onEditSku(variant)}
                      >
                        Editar SKU
                      </Button>
                    ) : null}
                    {canArchive && variant.status !== 'archived' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => onArchive(variant)}
                      >
                        Arquivar
                      </Button>
                    ) : null}
                    {canRestore && variant.status === 'archived' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => onRestore(variant)}
                      >
                        Restaurar
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
