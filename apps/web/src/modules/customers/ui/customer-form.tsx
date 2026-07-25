import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { CreateCustomerInput } from '#/modules/customers/domain/types'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { ButtonLoading } from '#/platform/loading'
import { dialogs } from '#/platform/dialogs'
import { cn } from '#/lib/utils'

export type CustomerFormValues = CreateCustomerInput

const empty: CustomerFormValues = {
  name: '',
  tradeName: '',
  personType: 'PJ',
  document: '',
  email: '',
  phone: '',
  city: '',
  notes: '',
}

export function CustomerForm({
  initial,
  submitting,
  fieldErrors,
  formError,
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
  readOnly,
}: {
  initial?: Partial<CustomerFormValues>
  submitting?: boolean
  fieldErrors?: Record<string, string>
  formError?: string | null
  submitLabel?: string
  onSubmit: (values: CustomerFormValues) => void | Promise<void>
  onCancel?: () => void
  readOnly?: boolean
}) {
  const baselineRef = useRef<CustomerFormValues>({ ...empty, ...initial })
  const [values, setValues] = useState<CustomerFormValues>(() => ({
    ...empty,
    ...initial,
  }))

  const isDirty =
    JSON.stringify(values) !== JSON.stringify(baselineRef.current)

  function set<K extends keyof CustomerFormValues>(
    key: K,
    value: CustomerFormValues[K],
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
      <div className="flex gap-2">
        {(['PJ', 'PF'] as const).map((type) => (
          <button
            key={type}
            type="button"
            disabled={readOnly || submitting}
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

      <Field label="Nome *" error={fieldErrors?.name}>
        <Input
          value={values.name}
          disabled={readOnly || submitting}
          onChange={(e) => set('name', e.target.value)}
          aria-invalid={Boolean(fieldErrors?.name)}
        />
      </Field>

      {values.personType === 'PJ' ? (
        <Field label="Nome fantasia" error={fieldErrors?.tradeName}>
          <Input
            value={values.tradeName ?? ''}
            disabled={readOnly || submitting}
            onChange={(e) => set('tradeName', e.target.value)}
          />
        </Field>
      ) : null}

      <Field
        label={values.personType === 'PF' ? 'CPF' : 'CNPJ'}
        error={fieldErrors?.document}
      >
        <Input
          value={values.document ?? ''}
          disabled={readOnly || submitting}
          onChange={(e) => set('document', e.target.value)}
          aria-invalid={Boolean(fieldErrors?.document)}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="E-mail" error={fieldErrors?.email}>
          <Input
            type="email"
            value={values.email ?? ''}
            disabled={readOnly || submitting}
            onChange={(e) => set('email', e.target.value)}
          />
        </Field>
        <Field label="Telefone" error={fieldErrors?.phone}>
          <Input
            value={values.phone ?? ''}
            disabled={readOnly || submitting}
            onChange={(e) => set('phone', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Cidade" error={fieldErrors?.city}>
        <Input
          value={values.city ?? ''}
          disabled={readOnly || submitting}
          onChange={(e) => set('city', e.target.value)}
        />
      </Field>

      <Field label="Observações" error={fieldErrors?.notes}>
        <textarea
          value={values.notes ?? ''}
          disabled={readOnly || submitting}
          onChange={(e) => set('notes', e.target.value)}
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
