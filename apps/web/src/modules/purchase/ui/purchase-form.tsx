import { useMemo, useState, type FormEvent } from 'react'
import type { CreatePurchaseInput } from '#/modules/purchase/domain/types'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Select } from '#/components/ui/select'
import { ButtonLoading } from '#/platform/loading'
import { useSupplierSearch } from '#/modules/suppliers/ui/use-supplier-queries'

export type PurchaseFormValues = CreatePurchaseInput & {
  supplierLabel?: string
}

const empty: PurchaseFormValues = {
  supplierId: '',
  supplierLabel: '',
  currency: 'BRL',
  notes: '',
}

export function PurchaseForm({
  initial,
  submitting,
  fieldErrors,
  formError,
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
}: {
  initial?: Partial<PurchaseFormValues>
  submitting?: boolean
  fieldErrors?: Record<string, string>
  formError?: string | null
  submitLabel?: string
  onSubmit: (values: PurchaseFormValues) => void | Promise<void>
  onCancel?: () => void
}) {
  const [values, setValues] = useState<PurchaseFormValues>(() => ({
    ...empty,
    ...initial,
  }))
  const [supplierQuery, setSupplierQuery] = useState(
    initial?.supplierLabel ?? '',
  )
  const supplierSearch = useSupplierSearch(supplierQuery)

  const supplierOptions = useMemo(
    () => supplierSearch.data ?? [],
    [supplierSearch.data],
  )

  function set<K extends keyof PurchaseFormValues>(
    key: K,
    value: PurchaseFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    await onSubmit(values)
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      {formError ? (
        <p className="text-sm text-[var(--color-danger)]">{formError}</p>
      ) : null}

      <FormField label="Fornecedor" error={fieldErrors?.supplierId}>
        <Input
          value={supplierQuery}
          onChange={(e) => {
            setSupplierQuery(e.target.value)
            if (!e.target.value.trim()) {
              set('supplierId', '')
              set('supplierLabel', '')
            }
          }}
          placeholder="Buscar fornecedor…"
          list="purchase-supplier-options"
        />
        <datalist id="purchase-supplier-options">
          {supplierOptions.map((s) => (
            <option
              key={s.id}
              value={s.legalName}
              onClick={() => {
                set('supplierId', s.id)
                set('supplierLabel', s.legalName)
              }}
            />
          ))}
        </datalist>
        {supplierOptions.length > 0 && supplierQuery.trim().length >= 2 ? (
          <div className="mt-2 max-h-40 overflow-auto rounded border border-[var(--color-border)]">
            {supplierOptions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-hover)]"
                onClick={() => {
                  set('supplierId', s.id)
                  set('supplierLabel', s.legalName)
                  setSupplierQuery(s.legalName)
                }}
              >
                {s.legalName}
                {s.document ? (
                  <span className="ml-2 text-[var(--color-text-secondary)]">
                    {s.document}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </FormField>

      <FormField label="Moeda" error={fieldErrors?.currency}>
        <Select
          value={values.currency ?? 'BRL'}
          onChange={(e) => set('currency', e.target.value.toUpperCase())}
        >
          <option value="BRL">BRL</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </Select>
      </FormField>

      <FormField label="Observações" error={fieldErrors?.notes}>
        <Textarea
          value={values.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
        />
      </FormField>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? <ButtonLoading label="Salvando…" /> : submitLabel}
        </Button>
      </div>
    </form>
  )
}
