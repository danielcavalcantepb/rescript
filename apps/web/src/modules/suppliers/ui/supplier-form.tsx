import { useRef, useState, type FormEvent } from 'react'
import type { CreateSupplierInput } from '#/modules/suppliers/domain/types'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { ButtonLoading } from '#/platform/loading'
import { dialogs } from '#/platform/dialogs'
import { cn } from '#/lib/utils'

export type SupplierFormValues = CreateSupplierInput

const empty: SupplierFormValues = {
  legalName: '',
  tradeName: '',
  personType: 'PJ',
  document: '',
  email: '',
  phone: '',
  city: '',
  notes: '',
  activate: true,
}

export function SupplierForm({
  initial,
  submitting,
  fieldErrors,
  formError,
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
  readOnly,
  lockPersonType,
}: {
  initial?: Partial<SupplierFormValues>
  submitting?: boolean
  fieldErrors?: Record<string, string>
  formError?: string | null
  submitLabel?: string
  onSubmit: (values: SupplierFormValues) => void | Promise<void>
  onCancel?: () => void
  readOnly?: boolean
  /** Person type is immutable after create. */
  lockPersonType?: boolean
}) {
  const baselineRef = useRef<SupplierFormValues>({ ...empty, ...initial })
  const [values, setValues] = useState<SupplierFormValues>(() => ({
    ...empty,
    ...initial,
  }))

  const isDirty =
    JSON.stringify(values) !== JSON.stringify(baselineRef.current)

  function set<K extends keyof SupplierFormValues>(
    key: K,
    value: SupplierFormValues[K],
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
      <div className="flex gap-2" role="group" aria-label="Tipo de pessoa">
        {(['PJ', 'PF'] as const).map((type) => (
          <button
            key={type}
            type="button"
            disabled={readOnly || submitting || lockPersonType}
            onClick={() => set('personType', type)}
            className={cn(
              'rounded-[var(--radius-md)] border px-3 py-1.5 text-xs font-medium transition-colors',
              values.personType === type
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)]',
            )}
          >
            {type}
          </button>
        ))}
      </div>

      <FormField
        label={values.personType === 'PF' ? 'Nome *' : 'Razão social *'}
        error={fieldErrors?.legalName}
      >
        <Input
          value={values.legalName}
          disabled={readOnly || submitting}
          onChange={(e) => set('legalName', e.target.value)}
        />
      </FormField>

      {values.personType === 'PJ' ? (
        <FormField label="Nome fantasia" error={fieldErrors?.tradeName}>
          <Input
            value={values.tradeName ?? ''}
            disabled={readOnly || submitting}
            onChange={(e) => set('tradeName', e.target.value)}
          />
        </FormField>
      ) : null}

      <FormField
        label={values.personType === 'PF' ? 'CPF' : 'CNPJ'}
        error={fieldErrors?.document}
      >
        <Input
          value={values.document ?? ''}
          disabled={readOnly || submitting}
          onChange={(e) => set('document', e.target.value)}
          inputMode="numeric"
          autoComplete="off"
        />
      </FormField>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="E-mail" error={fieldErrors?.email}>
          <Input
            type="email"
            value={values.email ?? ''}
            disabled={readOnly || submitting}
            onChange={(e) => set('email', e.target.value)}
          />
        </FormField>
        <FormField label="Telefone" error={fieldErrors?.phone}>
          <Input
            value={values.phone ?? ''}
            disabled={readOnly || submitting}
            onChange={(e) => set('phone', e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Cidade" error={fieldErrors?.city}>
        <Input
          value={values.city ?? ''}
          disabled={readOnly || submitting}
          onChange={(e) => set('city', e.target.value)}
        />
      </FormField>

      <FormField label="Observações" error={fieldErrors?.notes}>
        <Textarea
          value={values.notes ?? ''}
          disabled={readOnly || submitting}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
        />
      </FormField>

      {!lockPersonType && !readOnly ? (
        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={Boolean(values.activate)}
            disabled={submitting}
            onChange={(e) => set('activate', e.target.checked)}
          />
          Ativar ao salvar (documento obrigatório)
        </label>
      ) : null}

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
