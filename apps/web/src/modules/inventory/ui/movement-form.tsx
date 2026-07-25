import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ButtonLoading } from '#/platform/loading'
import { dialogs } from '#/platform/dialogs'

export type MovementFormMode = 'entry' | 'exit' | 'adjustment'

export type MovementFormValues = {
  productId: string
  quantity: string
  reason: string
  notes: string
  /** Only used when mode === 'adjustment'. */
  direction: 'in' | 'out'
  occurredAt: string
}

const empty: MovementFormValues = {
  productId: '',
  quantity: '',
  reason: '',
  notes: '',
  direction: 'in',
  occurredAt: '',
}

const MODE_LABELS: Record<MovementFormMode, string> = {
  entry: 'Entrada',
  exit: 'Saída',
  adjustment: 'Ajuste',
}

export function MovementForm({
  mode,
  initial,
  submitting,
  fieldErrors,
  formError,
  submitLabel,
  productOptions,
  productLabel,
  onSubmit,
  onCancel,
  readOnly,
}: {
  mode: MovementFormMode
  initial?: Partial<MovementFormValues>
  submitting?: boolean
  fieldErrors?: Record<string, string>
  formError?: string | null
  submitLabel?: string
  /** Optional select options — omit when productId is fixed (e.g. product detail). */
  productOptions?: Array<{ id: string; label: string }>
  /** Read-only product label when product is fixed. */
  productLabel?: string
  onSubmit: (values: MovementFormValues) => void | Promise<void>
  onCancel?: () => void
  readOnly?: boolean
}) {
  const baselineRef = useRef<MovementFormValues>({ ...empty, ...initial })
  const [values, setValues] = useState<MovementFormValues>(() => ({
    ...empty,
    ...initial,
  }))

  const isDirty =
    JSON.stringify(values) !== JSON.stringify(baselineRef.current)

  function set<K extends keyof MovementFormValues>(
    key: K,
    value: MovementFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting || readOnly) return
    await onSubmit(values)
  }

  async function handleCancel() {
    if (!onCancel) return
    if (!isDirty || submitting) {
      onCancel()
      return
    }
    const result = await dialogs.confirm({
      title: 'Descartar alterações?',
      description: 'As mudanças não salvas serão perdidas.',
      confirmLabel: 'Descartar',
      tone: 'danger',
    })
    if (result.confirmed) onCancel()
  }

  const defaultSubmit =
    mode === 'adjustment' ? 'Registrar ajuste' : `Registrar ${MODE_LABELS[mode].toLowerCase()}`

  return (
    <form className="space-y-3.5" onSubmit={(e) => void handleSubmit(e)}>
      {productOptions ? (
        <Field label="Produto *" error={fieldErrors?.productId}>
          <select
            value={values.productId}
            disabled={readOnly || submitting}
            onChange={(e) => set('productId', e.target.value)}
            aria-invalid={Boolean(fieldErrors?.productId)}
            className="flex h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 text-[13px] text-[var(--color-ink)] outline-none focus:border-[var(--color-focus)]"
          >
            <option value="">Selecione…</option>
            {productOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      ) : productLabel ? (
        <Field label="Produto">
          <p className="text-[13px] text-[var(--color-ink)]">{productLabel}</p>
        </Field>
      ) : null}

      {mode === 'adjustment' ? (
        <Field label="Direção *" error={fieldErrors?.type}>
          <select
            value={values.direction}
            disabled={readOnly || submitting}
            onChange={(e) =>
              set('direction', e.target.value as 'in' | 'out')
            }
            className="flex h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 text-[13px] text-[var(--color-ink)] outline-none focus:border-[var(--color-focus)]"
          >
            <option value="in">Ajuste de entrada (+)</option>
            <option value="out">Ajuste de saída (−)</option>
          </select>
        </Field>
      ) : null}

      <Field label="Quantidade *" error={fieldErrors?.quantity}>
        <Input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={values.quantity}
          disabled={readOnly || submitting}
          onChange={(e) => set('quantity', e.target.value)}
          aria-invalid={Boolean(fieldErrors?.quantity)}
        />
      </Field>

      <Field label="Motivo *" error={fieldErrors?.reason}>
        <Input
          value={values.reason}
          disabled={readOnly || submitting}
          onChange={(e) => set('reason', e.target.value)}
          aria-invalid={Boolean(fieldErrors?.reason)}
          placeholder={
            mode === 'adjustment'
              ? 'Obrigatório para ajustes'
              : 'Ex.: compra, uso interno…'
          }
        />
      </Field>

      <Field label="Observações" error={fieldErrors?.notes}>
        <textarea
          value={values.notes}
          disabled={readOnly || submitting}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          className="flex w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-[13px] text-[var(--color-ink)] outline-none focus:border-[var(--color-focus)]"
        />
      </Field>

      <Field label="Data do movimento" error={fieldErrors?.occurredAt}>
        <Input
          type="datetime-local"
          value={values.occurredAt}
          disabled={readOnly || submitting}
          onChange={(e) => set('occurredAt', e.target.value)}
        />
      </Field>

      {formError ? (
        <p className="rounded-[var(--radius-sm)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs text-[var(--color-danger)]">
          {formError}
        </p>
      ) : null}

      {!readOnly ? (
        <div className="flex justify-end gap-2 pt-2">
          {onCancel ? (
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => void handleCancel()}
            >
              Cancelar
            </Button>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <ButtonLoading label="Registrando…" />
            ) : (
              (submitLabel ?? defaultSubmit)
            )}
          </Button>
        </div>
      ) : null}
    </form>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-[13px] font-medium text-[var(--color-ink)]">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>
      ) : null}
    </div>
  )
}
