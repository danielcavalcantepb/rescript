import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EmptyState } from '#/components/EmptyState'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/components/ui/dialog'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { formatDateTime } from '#/lib/format'
import {
  isReceiptEditable,
  receiptStatusLabel,
} from '#/modules/receiving/domain/lifecycle'
import type { GoodsReceiptItem } from '#/modules/receiving/domain/types'
import { ReceivingRpcClientError } from '#/modules/receiving/ui/errors/receiving-rpc-errors'
import {
  toFormError,
  useArchiveReceipt,
  useCancelReceipt,
  usePostReceipt,
  useReceipt,
  useReceiptHistory,
  useReceiveComplete,
  useRestoreReceipt,
  useUpdateReceiptItem,
} from '#/modules/receiving/ui/use-receiving-queries'
import { dialogs } from '#/platform/dialogs'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import {
  FeatureGate,
  RequirePermission,
  usePermission,
} from '#/platform/permissions'
import { notificationService } from '#/platform/services'

export function ReceiptDetailPage({ receiptId }: { receiptId: string }) {
  return (
    <RequirePermission
      permission="receiving.read"
      forbiddenDescription="Você não tem permissão para ver recebimentos."
    >
      <ReceiptDetailContent receiptId={receiptId} />
    </RequirePermission>
  )
}

function ReceiptDetailContent({ receiptId }: { receiptId: string }) {
  const { can } = usePermission()
  const detail = useReceipt(receiptId)
  const history = useReceiptHistory(receiptId)
  const post = usePostReceipt(receiptId)
  const cancel = useCancelReceipt()
  const archive = useArchiveReceipt()
  const restore = useRestoreReceipt()
  const receiveComplete = useReceiveComplete(receiptId)
  const updateItem = useUpdateReceiptItem(receiptId)

  const [editItem, setEditItem] = useState<GoodsReceiptItem | null>(null)
  const [receivedQty, setReceivedQty] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  if (detail.isLoading) return <PageLoading />

  if (detail.isError) {
    const err = detail.error
    if (err instanceof ReceivingRpcClientError && err.code === 'receipt_not_found') {
      return (
        <div>
          <PageHeader title="Recebimento não encontrado" />
          <Button asChild variant="secondary">
            <Link to="/procurement/receiving">Voltar</Link>
          </Button>
        </div>
      )
    }
    return <PageError error={err as Error} onRetry={() => void detail.refetch()} />
  }

  const snapshot = detail.data
  if (!snapshot) return <PageLoading />
  const { receipt, items, totals } = snapshot
  const editable = isReceiptEditable(receipt.status)

  function openEdit(item: GoodsReceiptItem) {
    setEditItem(item)
    setReceivedQty(item.receivedQuantity)
    setFieldErrors({})
    setFormError(null)
  }

  async function handleUpdateItem() {
    if (!editItem) return
    setFieldErrors({})
    setFormError(null)
    try {
      await updateItem.mutateAsync({
        itemId: editItem.id,
        input: { receivedQuantity: receivedQty },
      })
      notificationService.success('Quantidade atualizada.')
      setEditItem(null)
      void detail.refetch()
    } catch (error) {
      const mapped = toFormError(error)
      setFieldErrors(mapped.fieldErrors)
      setFormError(mapped.formError)
    }
  }

  async function handleReceiveComplete() {
    try {
      await receiveComplete.mutateAsync()
      notificationService.success('Quantidades preenchidas com pedido completo.')
      void detail.refetch()
    } catch (error) {
      notificationService.error(toFormError(error).formError ?? 'Falha ao receber.')
    }
  }

  async function handlePost() {
    const confirmed = await dialogs.confirm({
      title: 'Lançar recebimento?',
      description:
        'Será criada entrada no estoque (Ledger ENTRY) e o progresso do pedido será atualizado.',
      confirmLabel: 'Lançar',
    })
    if (!confirmed) return
    try {
      await post.mutateAsync({
        idempotencyKey: crypto.randomUUID(),
        allowOverReceive: false,
      })
      notificationService.success('Recebimento lançado.')
      void detail.refetch()
    } catch (error) {
      notificationService.error(toFormError(error).formError ?? 'Falha ao lançar.')
    }
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: 'Compras', href: '/procurement/purchases' },
          { label: 'Recebimentos', href: '/procurement/receiving' },
          { label: receipt.number },
        ]}
      />

      <PageHeader
        title={receipt.number}
        description={`Pedido ${receipt.purchaseSnapshot.purchaseNumber} · ${receipt.supplierSnapshot.legalName}${receipt.supplierSnapshot.document ? ` · ${receipt.supplierSnapshot.document}` : ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={receiptStatusLabel(receipt.status)} />
            {editable && can('receiving.receive') ? (
              <Button
                type="button"
                variant="secondary"
                disabled={receiveComplete.isPending}
                onClick={() => void handleReceiveComplete()}
              >
                Receber tudo
              </Button>
            ) : null}
            {editable && can('receiving.post') ? (
              <Button
                type="button"
                disabled={post.isPending}
                onClick={() => void handlePost()}
              >
                Lançar
              </Button>
            ) : null}
            {editable && can('receiving.cancel') ? (
              <Button
                type="button"
                variant="secondary"
                disabled={cancel.isPending}
                onClick={() =>
                  void cancel.mutateAsync(receiptId).then(() => {
                    notificationService.success('Recebimento cancelado.')
                    void detail.refetch()
                  })
                }
              >
                Cancelar
              </Button>
            ) : null}
            {receipt.status !== 'archived' && can('receiving.archive') ? (
              <Button
                type="button"
                variant="secondary"
                disabled={archive.isPending}
                onClick={() =>
                  void archive.mutateAsync(receiptId).then(() => {
                    notificationService.success('Recebimento arquivado.')
                    void detail.refetch()
                  })
                }
              >
                Arquivar
              </Button>
            ) : null}
            {receipt.status === 'archived' && can('receiving.restore') ? (
              <Button
                type="button"
                disabled={restore.isPending}
                onClick={() =>
                  void restore.mutateAsync(receiptId).then(() => {
                    notificationService.success('Recebimento restaurado.')
                    void detail.refetch()
                  })
                }
              >
                Restaurar
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <div className="text-xs text-[var(--color-text-secondary)]">Linhas</div>
          <div className="text-lg font-semibold">{totals.lines}</div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <div className="text-xs text-[var(--color-text-secondary)]">Recebido</div>
          <div className="text-lg font-semibold">{totals.receivedQuantity}</div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <div className="text-xs text-[var(--color-text-secondary)]">Pendente (linhas)</div>
          <div className="text-lg font-semibold">{totals.pendingQuantity}</div>
        </div>
      </div>

      {receipt.notes ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 text-sm">
          <div className="font-medium">Observações</div>
          <p className="mt-1 whitespace-pre-wrap text-[var(--color-text-secondary)]">
            {receipt.notes}
          </p>
        </div>
      ) : null}

      {receipt.receivedAt ? (
        <p className="text-sm text-[var(--color-text-secondary)]">
          Lançado em {formatDateTime(receipt.receivedAt)}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Itens</h2>
        {items.length === 0 ? (
          <EmptyState title="Sem itens" description="Este recebimento não possui linhas." />
        ) : (
          <EntityTable
            headers={[
              'Produto',
              'Pedido',
              'Recebido',
              'Pendente',
              ...(editable ? ([''] as const) : []),
            ]}
          >
            {items.map((item) => (
              <EntityRow key={item.id}>
                <EntityCell>
                  <div className="font-medium">{item.variantName}</div>
                  {item.variantSku ? (
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      SKU {item.variantSku}
                    </div>
                  ) : null}
                </EntityCell>
                <EntityCell>
                  {item.orderedQuantity} {item.unitCode}
                </EntityCell>
                <EntityCell>
                  {item.receivedQuantity} {item.unitCode}
                </EntityCell>
                <EntityCell>
                  {item.pendingQuantity} {item.unitCode}
                </EntityCell>
                {editable ? (
                  <EntityCell>
                    <FeatureGate permission="receiving.receive">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openEdit(item)}
                      >
                        Editar qty
                      </Button>
                    </FeatureGate>
                  </EntityCell>
                ) : null}
              </EntityRow>
            ))}
          </EntityTable>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Histórico</h2>
        {history.isLoading ? (
          <PageLoading />
        ) : (history.data ?? []).length === 0 ? (
          <EmptyState title="Sem histórico" description="Nenhum evento registrado." />
        ) : (
          <ul className="space-y-2 text-sm">
            {(history.data ?? []).map((entry) => (
              <li
                key={entry.id}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2"
              >
                <div className="font-medium">{entry.action}</div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {formatDateTime(entry.createdAt)}
                  {entry.reason ? ` · ${entry.reason}` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={Boolean(editItem)} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogTitle>Quantidade recebida</DialogTitle>
          <DialogDescription>
            {editItem?.variantName} — pedido {editItem?.orderedQuantity} {editItem?.unitCode}
          </DialogDescription>
          {formError ? (
            <p className="text-sm text-[var(--color-danger)]">{formError}</p>
          ) : null}
          <FormField label="Quantidade" error={fieldErrors.receivedQuantity}>
            <Input
              value={receivedQty}
              onChange={(e) => setReceivedQty(e.target.value)}
              inputMode="decimal"
            />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setEditItem(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={updateItem.isPending}
              onClick={() => void handleUpdateItem()}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
