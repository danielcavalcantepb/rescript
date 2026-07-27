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
import { Textarea } from '#/components/ui/textarea'
import { formatBRL, formatDate, formatDateTime } from '#/lib/format'
import {
  installmentStatusLabel,
  isPayableEditable,
  payableStatusLabel,
} from '#/modules/payable/domain/lifecycle'
import { PayableRpcClientError } from '#/modules/payable/ui/errors/payable-rpc-errors'
import {
  toFormError,
  useApprovePayable,
  useArchivePayable,
  useCancelPayable,
  usePayable,
  usePayableHistory,
  useRestorePayable,
  useUpdatePayable,
} from '#/modules/payable/ui/use-payable-queries'
import { PageError } from '#/platform/errors'
import { PageLoading, ButtonLoading } from '#/platform/loading'
import {
  FeatureGate,
  RequirePermission,
  usePermission,
} from '#/platform/permissions'
import { notificationService } from '#/platform/services'

function formatMoney(currency: string, amount: string): string {
  const value = Number(amount)
  if (currency === 'BRL') return formatBRL(value)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function PayableDetailPage({ payableId }: { payableId: string }) {
  return (
    <RequirePermission
      permission="payable.read"
      forbiddenDescription="Você não tem permissão para ver contas a pagar."
    >
      <PayableDetailContent payableId={payableId} />
    </RequirePermission>
  )
}

function PayableDetailContent({ payableId }: { payableId: string }) {
  const { can } = usePermission()
  const detail = usePayable(payableId)
  const history = usePayableHistory(payableId)
  const approve = useApprovePayable()
  const cancel = useCancelPayable()
  const archive = useArchivePayable()
  const restore = useRestorePayable()
  const update = useUpdatePayable(payableId)

  const [editOpen, setEditOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  if (detail.isLoading) return <PageLoading />

  if (detail.isError) {
    const err = detail.error
    if (
      err instanceof PayableRpcClientError &&
      err.code === 'payable_not_found'
    ) {
      return (
        <div>
          <PageHeader title="Conta não encontrada" />
          <Button asChild variant="secondary">
            <Link to="/finance/accounts-payable">Voltar</Link>
          </Button>
        </div>
      )
    }
    return (
      <PageError error={err as Error} onRetry={() => void detail.refetch()} />
    )
  }

  const snapshot = detail.data
  if (!snapshot) return <PageLoading />
  const { payable, installments } = snapshot
  const editable = isPayableEditable(payable.status)

  function openEdit() {
    setNotes(payable.notes ?? '')
    setIssueDate(payable.issueDate)
    setFieldErrors({})
    setFormError(null)
    setEditOpen(true)
  }

  async function handleUpdate() {
    setFieldErrors({})
    setFormError(null)
    try {
      await update.mutateAsync({
        notes: notes.trim() || null,
        issueDate: issueDate || undefined,
      })
      notificationService.success('Conta atualizada.')
      setEditOpen(false)
      void detail.refetch()
    } catch (error) {
      const mapped = toFormError(error)
      setFieldErrors(mapped.fieldErrors)
      setFormError(mapped.formError)
    }
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: 'Financeiro', href: '/finance' },
          { label: 'Contas a pagar', href: '/finance/accounts-payable' },
          { label: payable.number },
        ]}
      />

      <PageHeader
        title={payable.number}
        description={`${payable.supplierSnapshot.legalName}${
          payable.supplierSnapshot.document
            ? ` · ${payable.supplierSnapshot.document}`
            : ''
        }`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={payableStatusLabel(payable.status)} />
            {Number(payable.totals.openBalance) > 0 &&
            (payable.status === 'approved' || payable.status === 'partially_paid') &&
            can('payments.create') ? (
              <Button asChild>
                <Link to="/finance/payments/new" search={{ payableId }}>
                  Registrar pagamento
                </Link>
              </Button>
            ) : null}
            {editable && can('payable.edit') ? (
              <Button type="button" variant="secondary" onClick={openEdit}>
                Editar
              </Button>
            ) : null}
            {payable.status === 'draft' && can('payable.approve') ? (
              <Button
                type="button"
                disabled={approve.isPending}
                onClick={() =>
                  void approve.mutateAsync(payableId).then(() => {
                    notificationService.success('Conta aprovada.')
                    void detail.refetch()
                  })
                }
              >
                {approve.isPending ? (
                  <ButtonLoading label="Aprovando…" />
                ) : (
                  'Aprovar'
                )}
              </Button>
            ) : null}
            {(payable.status === 'draft' || payable.status === 'approved') &&
            can('payable.cancel') ? (
              <Button
                type="button"
                variant="secondary"
                disabled={cancel.isPending}
                onClick={() =>
                  void cancel.mutateAsync(payableId).then(() => {
                    notificationService.success('Conta cancelada.')
                    void detail.refetch()
                  })
                }
              >
                Cancelar
              </Button>
            ) : null}
            {payable.status !== 'archived' && can('payable.archive') ? (
              <Button
                type="button"
                variant="secondary"
                disabled={archive.isPending}
                onClick={() =>
                  void archive.mutateAsync(payableId).then(() => {
                    notificationService.success('Conta arquivada.')
                    void detail.refetch()
                  })
                }
              >
                Arquivar
              </Button>
            ) : null}
            {payable.status === 'archived' && can('payable.restore') ? (
              <Button
                type="button"
                disabled={restore.isPending}
                onClick={() =>
                  void restore.mutateAsync(payableId).then(() => {
                    notificationService.success('Conta restaurada.')
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <div className="text-xs text-[var(--color-text-secondary)]">
            Valor original
          </div>
          <div className="mt-1 text-lg font-semibold">
            {formatMoney(payable.currency, payable.totals.originalAmount)}
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <div className="text-xs text-[var(--color-text-secondary)]">
            Saldo em aberto
          </div>
          <div className="mt-1 text-lg font-semibold">
            {formatMoney(payable.currency, payable.totals.openBalance)}
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <div className="text-xs text-[var(--color-text-secondary)]">
            Emissão
          </div>
          <div className="mt-1 text-lg font-semibold">
            {formatDate(payable.issueDate)}
          </div>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <div className="text-xs text-[var(--color-text-secondary)]">
            Parcelas
          </div>
          <div className="mt-1 text-lg font-semibold">{installments.length}</div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <h2 className="text-sm font-semibold">Fornecedor</h2>
          <p className="mt-2 text-sm">{payable.supplierSnapshot.legalName}</p>
          {payable.supplierSnapshot.document ? (
            <p className="text-xs text-[var(--color-text-secondary)]">
              {payable.supplierSnapshot.document}
            </p>
          ) : null}
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <h2 className="text-sm font-semibold">Pedido de compra</h2>
          <p className="mt-2 text-sm">
            {payable.purchaseSnapshot.purchaseNumber}
          </p>
          <FeatureGate permission="purchase.read">
            <Button asChild variant="secondary" className="mt-3">
              <Link
                to="/procurement/purchases/$purchaseId"
                params={{
                  purchaseId: payable.purchaseSnapshot.purchaseOrderId,
                }}
              >
                Abrir pedido
              </Link>
            </Button>
          </FeatureGate>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <h2 className="text-sm font-semibold">Recebimento</h2>
          <p className="mt-2 text-sm">
            {payable.receivingSnapshot.goodsReceiptNumber}
          </p>
          {payable.receivingSnapshot.receivedAt ? (
            <p className="text-xs text-[var(--color-text-secondary)]">
              Lançado em{' '}
              {formatDateTime(payable.receivingSnapshot.receivedAt)}
            </p>
          ) : null}
          <FeatureGate permission="receiving.read">
            <Button asChild variant="secondary" className="mt-3">
              <Link
                to="/procurement/receiving/$receiptId"
                params={{
                  receiptId: payable.receivingSnapshot.goodsReceiptId,
                }}
              >
                Abrir recebimento
              </Link>
            </Button>
          </FeatureGate>
        </div>
      </section>

      {payable.notes ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 text-sm">
          <div className="font-medium">Observações</div>
          <p className="mt-1 whitespace-pre-wrap text-[var(--color-text-secondary)]">
            {payable.notes}
          </p>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Parcelas</h2>
        {installments.length === 0 ? (
          <EmptyState
            title="Sem parcelas"
            description="Esta conta não possui parcelas registradas."
          />
        ) : (
          <EntityTable
            headers={['#', 'Vencimento', 'Valor', 'Saldo', 'Status']}
          >
            {installments.map((row) => (
              <EntityRow key={row.id}>
                <EntityCell className="font-medium">{row.sequence}</EntityCell>
                <EntityCell>{formatDate(row.dueDate)}</EntityCell>
                <EntityCell>
                  {formatMoney(payable.currency, row.amount)}
                </EntityCell>
                <EntityCell>
                  {formatMoney(payable.currency, row.openBalance)}
                </EntityCell>
                <EntityCell>
                  <StatusBadge status={installmentStatusLabel(row.status)} />
                </EntityCell>
              </EntityRow>
            ))}
          </EntityTable>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Histórico</h2>
        {history.isLoading ? (
          <PageLoading />
        ) : !history.data?.length ? (
          <p className="text-sm text-[var(--color-text-secondary)]">
            Sem eventos registrados.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.data.map((entry) => (
              <li
                key={entry.id}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2"
              >
                <div className="font-medium">{entry.action}</div>
                {entry.fieldName ? (
                  <div className="text-[var(--color-text-secondary)]">
                    {entry.fieldName}
                    {entry.oldValue != null || entry.newValue != null
                      ? `: ${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}`
                      : ''}
                  </div>
                ) : null}
                <div className="text-[var(--color-text-secondary)]">
                  {formatDateTime(entry.createdAt)}
                  {entry.reason ? ` · ${entry.reason}` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogTitle>Editar conta</DialogTitle>
          <DialogDescription>
            Em rascunho é possível alterar emissão e observações. Parcelas não
            são editáveis nesta tela.
          </DialogDescription>
          <div className="space-y-4">
            {formError ? (
              <p className="text-sm text-[var(--color-danger)]">{formError}</p>
            ) : null}
            <FormField label="Data de emissão" error={fieldErrors.issueDate}>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </FormField>
            <FormField label="Observações" error={fieldErrors.notes}>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={update.isPending}
                onClick={() => void handleUpdate()}
              >
                {update.isPending ? (
                  <ButtonLoading label="Salvando…" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
