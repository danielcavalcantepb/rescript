import { useEffect, useRef, useState } from 'react'
import { Input } from '#/components/ui/input'
import type { CatalogSearchHitResponse } from '#/modules/catalog/application/dto'
import { useCatalogVariantSearch } from '#/modules/catalog/ui/hooks/use-catalog-variants'

type ScanRequest = { value: string; id: number }

/**
 * USB barcode readers behave like keyboards and submit their value with Enter.
 * This control keeps that workflow separate from the free-form product picker.
 */
export function BarcodeScannerInput({
  organizationId,
  disabled = false,
  onVariantFound,
}: {
  organizationId: string | undefined
  disabled?: boolean
  onVariantFound: (variant: CatalogSearchHitResponse) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handledRequest = useRef<number | null>(null)
  const [value, setValue] = useState('')
  const [request, setRequest] = useState<ScanRequest | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const search = useCatalogVariantSearch(organizationId, request?.value ?? '')

  function restoreFocus() {
    window.requestAnimationFrame(() => inputRef.current?.focus())
  }

  useEffect(() => {
    if (!disabled) restoreFocus()
  }, [disabled])

  useEffect(() => {
    if (!request || handledRequest.current === request.id || search.isFetching) return

    if (search.isError) {
      handledRequest.current = request.id
      setMessage('Não foi possível consultar o catálogo. Tente novamente.')
      restoreFocus()
      return
    }
    if (!search.isSuccess) return

    handledRequest.current = request.id
    const variant = search.data?.[0]
    if (!variant) {
      setMessage(`Nenhum produto encontrado para “${request.value}”.`)
    } else {
      onVariantFound(variant)
      setMessage(`${variant.productName} adicionado ao pedido.`)
    }
    setValue('')
    restoreFocus()
  }, [onVariantFound, request, search.data, search.isError, search.isFetching, search.isSuccess])

  return (
    <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-3">
      <label className="block text-sm font-medium" htmlFor="barcode-scanner">
        Código de barras
      </label>
      <p className="mt-1 text-xs text-[var(--color-muted)]">
        Leia o EAN ou digite SKU e pressione Enter para adicionar o item.
      </p>
      <Input
        ref={inputRef}
        id="barcode-scanner"
        className="mt-2"
        value={value}
        disabled={disabled}
        autoComplete="off"
        inputMode="text"
        placeholder="Aguardando leitura…"
        aria-describedby="barcode-scanner-feedback"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          event.preventDefault()
          const scannedValue = value.trim()
          if (!scannedValue || disabled) return
          setMessage(null)
          setRequest((current) => ({
            value: scannedValue,
            id: (current?.id ?? 0) + 1,
          }))
        }}
      />
      <p id="barcode-scanner-feedback" role="status" aria-live="polite" className="mt-2 min-h-5 text-xs text-[var(--color-muted)]">
        {search.isFetching ? 'Consultando catálogo…' : message}
      </p>
    </div>
  )
}
