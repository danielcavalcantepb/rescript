import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { CreateProductInput } from '#/modules/products/domain/types'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ButtonLoading } from '#/platform/loading'
import { dialogs } from '#/platform/dialogs'

export type ProductFormValues = CreateProductInput

const empty: ProductFormValues = {
  name: '',
  description: '',
  sku: '',
  category: '',
  unit: 'un',
}

export function ProductForm({
  initial,
  submitting,
  fieldErrors,
  formError,
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
  readOnly,
}: {
  initial?: Partial<ProductFormValues>
  submitting?: boolean
  fieldErrors?: Record<string, string>
  formError?: string | null
  submitLabel?: string
  onSubmit: (values: ProductFormValues) => void | Promise<void>
  onCancel?: () => void
  readOnly?: boolean
}) {
  const baselineRef = useRef<ProductFormValues>({ ...empty, ...initial })
  const [values, setValues] = useState<ProductFormValues>(() => ({
    ...empty,
    ...initial,
  }))

  const isDirty =
    JSON.stringify(values) !== JSON.stringify(baselineRef.current)

  function set<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
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

  return (
    <form className="space-y-3.5" onSubmit={(e) => void handleSubmit(e)}>
      <Field label="Nome *" error={fieldErrors?.name}>
        <Input
          value={values.name}
          disabled={readOnly || submitting}
          onChange={(e) => set('name', e.target.value)}
          aria-invalid={Boolean(fieldErrors?.name)}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="SKU *" error={fieldErrors?.sku}>
          <Input
            value={values.sku}
            disabled={readOnly || submitting}
            onChange={(e) => set('sku', e.target.value)}
            aria-invalid={Boolean(fieldErrors?.sku)}
            autoCapitalize="characters"
          />
        </Field>
        <Field label="Unidade *" error={fieldErrors?.unit}>
          <Input
            value={values.unit}
            disabled={readOnly || submitting}
            onChange={(e) => set('unit', e.target.value)}
            aria-invalid={Boolean(fieldErrors?.unit)}
            placeholder="un, kg, cx…"
          />
        </Field>
      </div>

      <Field label="Categoria" error={fieldErrors?.category}>
        <Input
          value={values.category ?? ''}
          disabled={readOnly || submitting}
          onChange={(e) => set('category', e.target.value)}
        />
      </Field>

      <Field label="Descrição" error={fieldErrors?.description}>
        <textarea
          value={values.description ?? ''}
          disabled={readOnly || submitting}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          className="flex w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-[13px] text-[var(--color-ink)] outline-none focus:border-[var(--color-focus)]"
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
            {submitting ? <ButtonLoading label="Salvando…" /> : submitLabel}
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
