import { useMemo, useState, type FormEvent } from 'react'
import type { CreateReceiptInput } from '#/modules/receiving/domain/types'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Select } from '#/components/ui/select'
import { ButtonLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { usePurchaseSearch } from '#/modules/purchase/ui/use-purchase-queries'
import { useLocations } from '#/modules/inventory/ui/hooks/use-inventory-foundation'

export type ReceiptFormValues = CreateReceiptInput & {
  purchaseLabel?: string
}

const empty: ReceiptFormValues = {
  purchaseOrderId: '',
  purchaseLabel: '',
  locationId: '',
  notes: '',
}

export function ReceiptForm({
  initial,
  submitting,
  fieldErrors,
  formError,
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ReceiptFormValues>
  submitting?: boolean
  fieldErrors?: Record<string, string>
  formError?: string | null
  submitLabel?: string
  onSubmit: (values: ReceiptFormValues) => void | Promise<void>
  onCancel?: () => void
}) {
  const { currentOrganization } = useOrganization()
  const [values, setValues] = useState<ReceiptFormValues>(() => ({
    ...empty,
    ...initial,
  }))
  const [purchaseQuery, setPurchaseQuery] = useState(
    initial?.purchaseLabel ?? '',
  )
  const purchaseSearch = usePurchaseSearch(purchaseQuery)
  const locations = useLocations(currentOrganization?.id)

  const purchaseOptions = useMemo(
    () =>
      (purchaseSearch.data ?? []).filter((p) => p.status === 'approved'),
    [purchaseSearch.data],
  )

  const locationOptions = useMemo(
    () => locations.data ?? [],
    [locations.data],
  )

  function set<K extends keyof ReceiptFormValues>(
    key: K,
    value: ReceiptFormValues[K],
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

      <FormField label="Pedido aprovado" error={fieldErrors?.purchaseOrderId}>
        <Input
          value={purchaseQuery}
          onChange={(e) => {
            setPurchaseQuery(e.target.value)
            if (!e.target.value.trim()) {
              set('purchaseOrderId', '')
              set('purchaseLabel', '')
            }
          }}
          placeholder="Buscar número ou fornecedor…"
          list="receipt-purchase-options"
        />
        <datalist id="receipt-purchase-options">
          {purchaseOptions.map((purchase) => (
            <option
              key={purchase.id}
              value={`${purchase.number} — ${purchase.supplierLegalName}`}
            />
          ))}
        </datalist>
        {purchaseOptions.length > 0 ? (
          <Select
            className="mt-2"
            value={values.purchaseOrderId}
            onChange={(e) => {
              const id = e.target.value
              const selected = purchaseOptions.find((p) => p.id === id)
              set('purchaseOrderId', id)
              set(
                'purchaseLabel',
                selected
                  ? `${selected.number} — ${selected.supplierLegalName}`
                  : '',
              )
              if (selected) setPurchaseQuery(`${selected.number} — ${selected.supplierLegalName}`)
            }}
          >
            <option value="">Selecione um pedido aprovado</option>
            {purchaseOptions.map((purchase) => (
              <option key={purchase.id} value={purchase.id}>
                {purchase.number} — {purchase.supplierLegalName}
              </option>
            ))}
          </Select>
        ) : null}
      </FormField>

      <FormField label="Local de estoque" error={fieldErrors?.locationId}>
        {locationOptions.length > 0 ? (
          <Select
            value={values.locationId}
            onChange={(e) => set('locationId', e.target.value)}
          >
            <option value="">Selecione o local</option>
            {locationOptions.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            value={values.locationId}
            onChange={(e) => set('locationId', e.target.value)}
            placeholder="Código do local de estoque"
          />
        )}
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
