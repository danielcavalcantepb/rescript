import type { VariantCombinationsPreviewResponse } from '#/modules/catalog/application'
import { Button } from '#/components/ui/button'

export function VariantCombinationPreview({
  preview,
  selectedKeys,
  onToggle,
  onSelectAllNew,
  onClearNew,
}: {
  preview: VariantCombinationsPreviewResponse
  selectedKeys: Set<string>
  onToggle: (selectionKey: string) => void
  onSelectAllNew: () => void
  onClearNew: () => void
}) {
  const news = preview.items.filter((i) => i.state === 'new')

  return (
    <div className="space-y-3" aria-live="polite">
      <div className="grid gap-2 text-[13px] sm:grid-cols-2">
        <Stat label="Total" value={preview.totalCombinations} />
        <Stat label="Existentes" value={preview.existingCount} />
        <Stat label="Novas" value={preview.newCount} />
        <Stat label="Arquivadas" value={preview.archivedCount} />
        <Stat label="Obsoletas" value={preview.obsoleteCount} />
      </div>

      {preview.requiresConfirmation ? (
        <p
          role="status"
          className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] px-3 py-2 text-[13px] text-[var(--color-ink)]"
        >
          Matriz grande ({preview.totalCombinations} combinações). Confirme
          antes de criar. Limite técnico do servidor:{' '}
          {preview.maxCombinations.toLocaleString('pt-BR')}.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={onSelectAllNew}>
          Selecionar novas
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onClearNew}>
          Limpar seleção
        </Button>
      </div>

      <ul className="max-h-64 space-y-1 overflow-y-auto" aria-label="Prévia de combinações">
        {preview.items
          .filter((i) => i.state !== 'obsolete')
          .map((item) => {
            const selectable = item.state === 'new'
            const checked = selectedKeys.has(item.selectionKey)
            return (
              <li
                key={item.selectionKey + item.state}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-[13px]"
              >
                {selectable ? (
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(item.selectionKey)}
                    aria-label={`Criar ${item.label}`}
                  />
                ) : (
                  <span className="inline-block w-4" aria-hidden />
                )}
                <span className="flex-1 text-[var(--color-ink)]">{item.label}</span>
                <span className="text-[12px] text-[var(--color-text-secondary)]">
                  {item.state === 'new'
                    ? 'Nova'
                    : item.state === 'archived'
                      ? 'Arquivada'
                      : item.sku ?? 'Existente'}
                </span>
              </li>
            )
          })}
      </ul>

      {news.length === 0 ? (
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Nenhuma combinação nova para criar.
        </p>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] px-3 py-2">
      <div className="text-[12px] text-[var(--color-text-secondary)]">{label}</div>
      <div className="font-mono text-[14px] text-[var(--color-ink)]">{value}</div>
    </div>
  )
}
