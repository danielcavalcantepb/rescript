import { useState } from 'react'
import type { ProductLifecycleAction } from '#/modules/catalog/application'
import { Button } from '#/components/ui/button'
import { ButtonLoading } from '#/platform/loading'
import { dialogs } from '#/platform/dialogs'
import { notificationService } from '#/platform/services'
import { catalogErrorMessage } from '#/modules/catalog/ui/errors/catalog-rpc-errors'
import { getCatalogRpcError } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import {
  useArchiveProduct,
  useDeactivateProduct,
  usePublishProduct,
  useRestoreProduct,
} from '#/modules/catalog/ui/hooks/use-catalog-lifecycle'

const ACTION_COPY: Record<
  ProductLifecycleAction,
  { label: string; confirmTitle: string; confirmDescription: string; success: string }
> = {
  publish: {
    label: 'Publicar',
    confirmTitle: 'Publicar produto?',
    confirmDescription:
      'O produto passará a ativo. É necessário preço efetivo, SKU e unidade na variante padrão.',
    success: 'Produto publicado',
  },
  archive: {
    label: 'Arquivar',
    confirmTitle: 'Arquivar produto?',
    confirmDescription:
      'O produto será arquivado (soft archive). Não será removido e poderá ser restaurado.',
    success: 'Produto arquivado',
  },
  deactivate: {
    label: 'Desativar',
    confirmTitle: 'Desativar produto?',
    confirmDescription:
      'O produto ativo será arquivado. Histórico é preservado; restauração retorna a rascunho.',
    success: 'Produto desativado',
  },
  restore: {
    label: 'Restaurar',
    confirmTitle: 'Restaurar produto?',
    confirmDescription:
      'O produto voltará para rascunho. Será necessário publicar novamente para ativá-lo.',
    success: 'Produto restaurado',
  },
}

export function ProductLifecycleActions({
  organizationId,
  productId,
  availableActions,
}: {
  organizationId: string
  productId: string
  availableActions: ProductLifecycleAction[]
}) {
  const publish = usePublishProduct(organizationId)
  const archive = useArchiveProduct(organizationId)
  const restore = useRestoreProduct(organizationId)
  const deactivate = useDeactivateProduct(organizationId)
  const [busyAction, setBusyAction] = useState<ProductLifecycleAction | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  if (availableActions.length === 0) return null

  async function run(action: ProductLifecycleAction) {
    const copy = ACTION_COPY[action]
    const confirmed = await dialogs.confirm({
      title: copy.confirmTitle,
      description: copy.confirmDescription,
      confirmLabel: copy.label,
      tone: action === 'archive' || action === 'deactivate' ? 'danger' : undefined,
    })
    if (!confirmed.confirmed) return

    setError(null)
    setBusyAction(action)
    const command = { productId }
    try {
      if (action === 'publish') await publish.mutateAsync(command)
      else if (action === 'archive') await archive.mutateAsync(command)
      else if (action === 'restore') await restore.mutateAsync(command)
      else await deactivate.mutateAsync(command)
      notificationService.success(copy.success)
    } catch (err) {
      const rpc = getCatalogRpcError(err)
      setError(
        rpc
          ? catalogErrorMessage(rpc)
          : 'Não foi possível atualizar o ciclo de vida.',
      )
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Ações de ciclo de vida"
      >
        {availableActions.map((action) => {
          const pending = busyAction === action
          return (
            <Button
              key={action}
              type="button"
              variant={
                action === 'publish' || action === 'restore'
                  ? 'primary'
                  : 'secondary'
              }
              disabled={busyAction !== null}
              aria-busy={pending || undefined}
              onClick={() => void run(action)}
            >
              {pending ? (
                <ButtonLoading label="Processando…" />
              ) : (
                ACTION_COPY[action].label
              )}
            </Button>
          )
        })}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  )
}
