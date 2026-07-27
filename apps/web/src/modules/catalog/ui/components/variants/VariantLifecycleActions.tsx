import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { dialogs } from '#/platform/dialogs'
import { notificationService } from '#/platform/services'
import type { VariantResponse } from '#/modules/catalog/application'
import { catalogErrorMessage } from '#/modules/catalog/ui/errors/catalog-rpc-errors'
import { getCatalogRpcError } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import {
  useArchiveVariant,
  useRestoreVariant,
} from '#/modules/catalog/ui/hooks/use-catalog-variants'

export function VariantLifecycleActions({
  organizationId,
  productId,
  variant,
  canArchive,
  canRestore,
}: {
  organizationId: string
  productId: string
  variant: VariantResponse
  canArchive: boolean
  canRestore: boolean
}) {
  const archive = useArchiveVariant(organizationId)
  const restore = useRestoreVariant(organizationId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runArchive() {
    const confirmed = await dialogs.confirm({
      title: 'Arquivar variante?',
      description:
        'A variante permanecerá no histórico (soft archive) e não será removida.',
      confirmLabel: 'Arquivar',
      tone: 'danger',
    })
    if (!confirmed.confirmed) return
    setBusy(true)
    setError(null)
    try {
      await archive.mutateAsync({ productId, variantId: variant.id })
      notificationService.success('Variante arquivada')
    } catch (err) {
      const rpc = getCatalogRpcError(err)
      setError(rpc ? catalogErrorMessage(rpc) : 'Falha ao arquivar.')
    } finally {
      setBusy(false)
    }
  }

  async function runRestore() {
    const confirmed = await dialogs.confirm({
      title: 'Restaurar variante?',
      description: 'A variante voltará para rascunho.',
      confirmLabel: 'Restaurar',
    })
    if (!confirmed.confirmed) return
    setBusy(true)
    setError(null)
    try {
      await restore.mutateAsync({ productId, variantId: variant.id })
      notificationService.success('Variante restaurada')
    } catch (err) {
      const rpc = getCatalogRpcError(err)
      setError(rpc ? catalogErrorMessage(rpc) : 'Falha ao restaurar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canArchive && variant.status !== 'archived' ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void runArchive()}
        >
          Arquivar
        </Button>
      ) : null}
      {canRestore && variant.status === 'archived' ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => void runRestore()}
        >
          Restaurar
        </Button>
      ) : null}
      {error ? (
        <p role="alert" className="text-[12px] text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
