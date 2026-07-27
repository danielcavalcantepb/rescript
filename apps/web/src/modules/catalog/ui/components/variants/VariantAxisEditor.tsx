import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import type { VariantAxisDraft } from '#/modules/catalog/application'
import { VariantOptionEditor } from '#/modules/catalog/ui/components/variants/VariantOptionEditor'

export function VariantAxisEditor({
  axes,
  onChange,
  disabled,
}: {
  axes: VariantAxisDraft[]
  onChange: (axes: VariantAxisDraft[]) => void
  disabled?: boolean
}) {
  function updateAxis(index: number, next: VariantAxisDraft) {
    const copy = [...axes]
    copy[index] = next
    onChange(copy)
  }

  function removeAxis(index: number) {
    onChange(axes.filter((_, i) => i !== index))
  }

  function addAxis() {
    if (axes.length >= 3) return
    onChange([...axes, { name: '', options: [''] }])
  }

  const total =
    axes.length === 0
      ? 0
      : axes.reduce((acc, axis) => {
          const n = axis.options.filter((o) => o.trim()).length
          return acc * Math.max(n, 1)
        }, 1)

  return (
    <div className="space-y-4">
      {axes.map((axis, index) => (
        <div
          key={index}
          className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] p-3"
        >
          <div className="mb-2 flex items-end gap-2">
            <div className="flex-1">
              <label
                className="mb-1 block text-[12px] text-[var(--color-text-secondary)]"
                htmlFor={`axis-name-${index}`}
              >
                Nome do eixo
              </label>
              <Input
                id={`axis-name-${index}`}
                value={axis.name}
                disabled={disabled}
                placeholder="Ex.: Cor, Volume, Numeração"
                onChange={(e) =>
                  updateAxis(index, { ...axis, name: e.target.value })
                }
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled || axes.length <= 1}
              onClick={() => removeAxis(index)}
            >
              Remover eixo
            </Button>
          </div>
          <VariantOptionEditor
            options={axis.options}
            disabled={disabled}
            onChange={(options) => updateAxis(index, { ...axis, options })}
          />
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || axes.length >= 3}
          onClick={addAxis}
        >
          Adicionar eixo
        </Button>
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Combinações estimadas: <strong className="text-[var(--color-ink)]">{total}</strong>
          {axes.length >= 3 ? ' · limite de 3 eixos' : null}
        </p>
      </div>
    </div>
  )
}
