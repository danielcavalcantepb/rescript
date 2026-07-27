import { useRef, useState, type FormEvent } from 'react'
import type { CreateProductInput } from '#/modules/products/domain/types'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
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
      <FormField label="Nome *" error={fieldErrors?.name}>
        <Input
          value={values.name}
          disabled={readOnly || submitting}
          onChange={(e) => set('name', e.target.value)}
        />
      </FormField>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="SKU *" error={fieldErrors?.sku}>
          <Input
            value={values.sku}
            disabled={readOnly || submitting}
            onChange={(e) => set('sku', e.target.value)}
            autoCapitalize="characters"
          />
        </FormField>
        <FormField label="Unidade *" error={fieldErrors?.unit}>
          <Input
            value={values.unit}
            disabled={readOnly || submitting}
            onChange={(e) => set('unit', e.target.value)}
            placeholder="un, kg, cx…"
          />
        </FormField>
      </div>

      <FormField label="Categoria" error={fieldErrors?.category}>
        <Input
          value={values.category ?? ''}
          disabled={readOnly || submitting}
          onChange={(e) => set('category', e.target.value)}
        />
      </FormField>

      <FormField label="Descrição" error={fieldErrors?.description}>
        <Textarea
          value={values.description ?? ''}
          disabled={readOnly || submitting}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
        />
      </FormField>

      {formError ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] bg-[var(--color-danger-bg)] px-3 py-2 text-xs text-[var(--color-danger)]"
        >
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
