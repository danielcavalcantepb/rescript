import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'

export function VariantOptionEditor({
  options,
  onChange,
  disabled,
}: {
  options: string[]
  onChange: (options: string[]) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-2" aria-label="Opções do eixo">
      <p className="text-[12px] text-[var(--color-text-secondary)]">Opções</p>
      {options.map((option, index) => (
        <div key={index} className="flex gap-2">
          <Input
            value={option}
            disabled={disabled}
            placeholder="Ex.: Preto, 50 ml, 38"
            aria-label={`Opção ${index + 1}`}
            onChange={(e) => {
              const next = [...options]
              next[index] = e.target.value
              onChange(next)
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || options.length <= 1}
            onClick={() => onChange(options.filter((_, i) => i !== index))}
          >
            Remover
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => onChange([...options, ''])}
      >
        Adicionar opção
      </Button>
    </div>
  )
}
