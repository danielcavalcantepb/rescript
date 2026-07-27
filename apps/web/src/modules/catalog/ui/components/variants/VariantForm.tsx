import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import type { VariantResponse } from '#/modules/catalog/application'

export function VariantForm({
  variant,
  onSubmit,
  onCancel,
  busy,
  error,
}: {
  variant: VariantResponse
  onSubmit: (sku: string) => Promise<void> | void
  onCancel: () => void
  busy?: boolean
  error?: string | null
}) {
  const [sku, setSku] = useState(variant.sku ?? '')

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (busy) return
        void onSubmit(sku.trim())
      }}
    >
      <div>
        <label
          htmlFor="variant-sku"
          className="mb-1 block text-[12px] text-[var(--color-text-secondary)]"
        >
          SKU
        </label>
        <Input
          id="variant-sku"
          value={sku}
          disabled={busy}
          autoFocus
          onChange={(e) => setSku(e.target.value)}
        />
      </div>
      {error ? (
        <p role="alert" className="text-[13px] text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy || !sku.trim()}>
          {busy ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
