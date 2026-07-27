import { useMemo, useState, type FormEvent } from 'react'
import type { CreatePayableInput } from '#/modules/payable/domain/types'
import { splitEqualInstallments } from '#/modules/payable/domain/totals'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { ButtonLoading } from '#/platform/loading'
import { useReceiptSearch } from '#/modules/receiving/ui/use-receiving-queries'

export type PayableFormValues = {
  goodsReceiptId: string
  receiptLabel: string
  issueDate: string
  notes: string
  installmentMode: 'single' | 'equal'
  installmentCount: string
  firstDueDate: string
  /** Must equal GR-derived AP total when installmentMode is equal. */
  estimatedTotal: string
}

const today = () => new Date().toISOString().slice(0, 10)

const empty: PayableFormValues = {
  goodsReceiptId: '',
  receiptLabel: '',
  issueDate: today(),
  notes: '',
  installmentMode: 'single',
  installmentCount: '2',
  firstDueDate: today(),
  estimatedTotal: '',
}

export function PayableForm({
  initial,
  submitting,
  fieldErrors,
  formError,
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
}: {
  initial?: Partial<PayableFormValues>
  submitting?: boolean
  fieldErrors?: Record<string, string>
  formError?: string | null
  submitLabel?: string
  onSubmit: (values: CreatePayableInput) => void | Promise<void>
  onCancel?: () => void
}) {
  const [values, setValues] = useState<PayableFormValues>(() => ({
    ...empty,
    ...initial,
  }))
  const [receiptQuery, setReceiptQuery] = useState(initial?.receiptLabel ?? '')
  const [localError, setLocalError] = useState<string | null>(null)
  const receiptSearch = useReceiptSearch(receiptQuery)

  const postedOptions = useMemo(
    () => (receiptSearch.data ?? []).filter((r) => r.status === 'posted'),
    [receiptSearch.data],
  )

  function set<K extends keyof PayableFormValues>(
    key: K,
    value: PayableFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    setLocalError(null)

    if (!values.goodsReceiptId.trim()) {
      setLocalError('Selecione um recebimento lançado.')
      return
    }

    const input: CreatePayableInput = {
      goodsReceiptId: values.goodsReceiptId,
      issueDate: values.issueDate || undefined,
      notes: values.notes.trim() || null,
    }

    if (values.installmentMode === 'equal') {
      const count = Number(values.installmentCount)
      const total = values.estimatedTotal.trim()
      if (!total || !Number.isFinite(Number(total)) || Number(total) <= 0) {
        setLocalError('Informe o valor total das parcelas (igual ao do recebimento).')
        return
      }
      if (!Number.isInteger(count) || count < 2 || count > 60) {
        setLocalError('Quantidade de parcelas deve ser entre 2 e 60.')
        return
      }
      try {
        input.installments = splitEqualInstallments(
          total,
          count,
          values.firstDueDate || today(),
        )
      } catch {
        setLocalError('Não foi possível montar as parcelas. Verifique os valores.')
        return
      }
    }

    await onSubmit(input)
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      {formError || localError ? (
        <p className="text-sm text-[var(--color-danger)]">
          {formError ?? localError}
        </p>
      ) : null}

      <FormField label="Recebimento lançado" error={fieldErrors?.goodsReceiptId}>
        <Input
          value={receiptQuery}
          onChange={(e) => {
            setReceiptQuery(e.target.value)
            if (!e.target.value.trim()) {
              set('goodsReceiptId', '')
              set('receiptLabel', '')
            }
          }}
          placeholder="Buscar GR-… ou fornecedor…"
        />
        {postedOptions.length > 0 && receiptQuery.trim().length >= 2 ? (
          <div className="mt-2 max-h-40 overflow-auto rounded border border-[var(--color-border)]">
            {postedOptions.map((r) => (
              <button
                key={r.id}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-muted)]"
                onClick={() => {
                  set('goodsReceiptId', r.id)
                  const label = `${r.number} · ${r.purchaseNumber} · ${r.supplierLegalName}`
                  set('receiptLabel', label)
                  setReceiptQuery(label)
                }}
              >
                <span className="font-medium">{r.number}</span>
                <span className="text-[var(--color-text-secondary)]">
                  {' '}
                  · {r.purchaseNumber} · {r.supplierLegalName}
                </span>
              </button>
            ))}
          </div>
        ) : null}
        {values.goodsReceiptId ? (
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Selecionado: {values.receiptLabel || values.goodsReceiptId}
          </p>
        ) : null}
      </FormField>

      <FormField label="Data de emissão" error={fieldErrors?.issueDate}>
        <Input
          type="date"
          value={values.issueDate}
          onChange={(e) => set('issueDate', e.target.value)}
        />
      </FormField>

      <FormField label="Parcelas">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={
              values.installmentMode === 'single' ? 'primary' : 'secondary'
            }
            onClick={() => set('installmentMode', 'single')}
          >
            Única
          </Button>
          <Button
            type="button"
            variant={
              values.installmentMode === 'equal' ? 'primary' : 'secondary'
            }
            onClick={() => set('installmentMode', 'equal')}
          >
            Parcelado
          </Button>
        </div>
      </FormField>

      {values.installmentMode === 'equal' ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField label="Qtd. parcelas" error={fieldErrors?.installments}>
            <Input
              type="number"
              min={2}
              max={60}
              value={values.installmentCount}
              onChange={(e) => set('installmentCount', e.target.value)}
            />
          </FormField>
          <FormField label="1º vencimento">
            <Input
              type="date"
              value={values.firstDueDate}
              onChange={(e) => set('firstDueDate', e.target.value)}
            />
          </FormField>
          <FormField
            label="Valor total (R$)"
            error={fieldErrors?.['installments.0.amount']}
          >
            <Input
              value={values.estimatedTotal}
              onChange={(e) => set('estimatedTotal', e.target.value)}
              placeholder="Igual ao total do GR"
            />
          </FormField>
        </div>
      ) : null}

      <FormField label="Observações" error={fieldErrors?.notes}>
        <Textarea
          value={values.notes}
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
        <Button type="submit" disabled={submitting || !values.goodsReceiptId}>
          {submitting ? <ButtonLoading label="Salvando…" /> : submitLabel}
        </Button>
      </div>
    </form>
  )
}
