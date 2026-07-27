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
import { Select } from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { formatBRL, formatDateTime } from '#/lib/format'
import {
  isPurchaseEditable,
  purchaseStatusLabel,
} from '#/modules/purchase/domain/lifecycle'
import type { PurchaseItem } from '#/modules/purchase/domain/types'
import { PurchaseRpcClientError } from '#/modules/purchase/ui/errors/purchase-rpc-errors'
import {
  toFormError,
  useAddPurchaseItem,
  useArchivePurchase,
  useCancelPurchase,
  useClosePurchase,
  useConfirmPurchase,
  usePurchase,
  usePurchaseHistory,
  useRemovePurchaseItem,
  useRestorePurchase,
  useSendPurchase,
  useUpdatePurchaseItem,
} from '#/modules/purchase/ui/use-purchase-queries'
import { dialogs } from '#/platform/dialogs'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import {
  FeatureGate,
  RequirePermission,
  usePermission,
} from '#/platform/permissions'
import { notificationService } from '#/platform/services'
import { usePriceLists } from '#/modules/pricing/ui/use-pricing'
import { useOrganization } from '#/platform/organization/organization-context'

function formatTotal(currency: string, amount: string): string {
  const value = Number(amount)
  if (currency === 'BRL') return formatBRL(value)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function PurchaseDetailPage({ purchaseId }: { purchaseId: string }) {
  return (
    <RequirePermission
      permission="purchasing.orders.read"
      forbiddenDescription="Você não tem permissão para ver pedidos de compra."
    >
      <PurchaseDetailContent purchaseId={purchaseId} />
    </RequirePermission>
  )
}

function PurchaseDetailContent({ purchaseId }: { purchaseId: string }) {
  const { can } = usePermission()
  const { currentOrganization } = useOrganization()
  const priceLists = usePriceLists(
    {
      organizationId: currentOrganization?.id ?? '',
      status: 'active',
      page: 1,
      pageSize: 100,
    },
    Boolean(currentOrganization?.id),
  )
  const detail = usePurchase(purchaseId)
  const history = usePurchaseHistory(purchaseId)
  const cancel = useCancelPurchase()
  const send = useSendPurchase()
  const confirm = useConfirmPurchase()
  const close = useClosePurchase()
  const archive = useArchivePurchase()
  const restore = useRestorePurchase()
  const addItem = useAddPurchaseItem(purchaseId)
  const updateItem = useUpdatePurchaseItem(purchaseId)
  const removeItem = useRemovePurchaseItem(purchaseId)

  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<PurchaseItem | null>(null)
  const [variantId, setVariantId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')
  const [priceListId, setPriceListId] = useState('')
  const [discount, setDiscount] = useState('0')
  const [description, setDescription] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  if (detail.isLoading) return <PageLoading />

  if (detail.isError) {
    const err = detail.error
    if (err instanceof PurchaseRpcClientError && err.code === 'purchase_not_found') {
      return (
        <div>
          <PageHeader title="Pedido não encontrado" />
          <Button asChild variant="secondary">
            <Link to="/procurement/purchases">Voltar</Link>
          </Button>
        </div>
      )
    }
    return <PageError error={err as Error} onRetry={() => void detail.refetch()} />
  }

  const snapshot = detail.data
  if (!snapshot) return <PageLoading />
  const { order, items } = snapshot
  const editable = isPurchaseEditable(order.status)

  function resetItemForm() {
    setVariantId('')
    setQuantity('1')
    setUnitPrice('')
    setPriceListId('')
    setDiscount('0')
    setDescription('')
    setFieldErrors({})
    setFormError(null)
  }

  async function handleAddItem() {
    setFieldErrors({})
    setFormError(null)
    try {
      await addItem.mutateAsync({
        variantId,
        priceListId,
        quantity,
        discount: discount.trim() ? discount : undefined,
        description: description.trim() ? description : undefined,
      })
      notificationService.success('Item adicionado.')
      setAddOpen(false)
      resetItemForm()
      void detail.refetch()
    } catch (error) {
      const mapped = toFormError(error)
      setFieldErrors(mapped.fieldErrors)
      setFormError(mapped.formError)
    }
  }

  async function handleUpdateItem() {
    if (!editItem) return
    setFieldErrors({})
    setFormError(null)
    try {
      await updateItem.mutateAsync({
        itemId: editItem.id,
        input: {
          quantity,
          unitPrice: unitPrice.trim() ? unitPrice : undefined,
          discount: discount.trim() ? discount : undefined,
          description: description.trim() ? description : null,
        },
      })
      notificationService.success('Item atualizado.')
      setEditItem(null)
      resetItemForm()
      void detail.refetch()
    } catch (error) {
      const mapped = toFormError(error)
      setFieldErrors(mapped.fieldErrors)
      setFormError(mapped.formError)
    }
  }

  async function handleRemoveItem(item: PurchaseItem) {
    const confirmed = await dialogs.confirm({
      title: 'Remover item?',
      description: `${item.variantName} será removido do pedido.`,
      confirmLabel: 'Remover',
      tone: 'danger',
    })
    if (!confirmed) return
    try {
      await removeItem.mutateAsync(item.id)
      notificationService.success('Item removido.')
      void detail.refetch()
    } catch (error) {
      notificationService.error(toFormError(error).formError ?? 'Falha ao remover item.')
    }
  }

  function openEdit(item: PurchaseItem) {
    setEditItem(item)
    setVariantId(item.variantId)
    setQuantity(item.quantity)
    setUnitPrice(item.unitPrice)
    setPriceListId(item.priceListId ?? '')
    setDiscount(item.discount)
    setDescription(item.description ?? '')
    setFieldErrors({})
    setFormError(null)
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: 'Compras', href: '/procurement/purchases' },
          { label: 'Pedidos', href: '/procurement/purchases' },
          { label: order.number },
        ]}
      />

      <PageHeader
        title={order.number}
        description={`${order.supplierSnapshot.legalName}${order.supplierSnapshot.document ? ` · ${order.supplierSnapshot.document}` : ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={purchaseStatusLabel(order.status)} />
            {order.status === 'draft' && can('purchasing.orders.update') ? (
              <Button
                type="button"
                disabled={send.isPending}
                onClick={() =>
                  void send.mutateAsync(purchaseId).then(() => {
                    notificationService.success('Pedido enviado.')
                    void detail.refetch()
                  })
                }
              >
                Enviar
              </Button>
            ) : null}
            {order.status === 'sent' && can('purchasing.orders.update') ? (
              <Button
                type="button"
                disabled={confirm.isPending}
                onClick={() =>
                  void confirm.mutateAsync(purchaseId).then(() => {
                    notificationService.success('Pedido confirmado.')
                    void detail.refetch()
                  })
                }
              >
                Confirmar
              </Button>
            ) : null}
            {order.status === 'confirmed' && can('purchasing.orders.close') ? (
              <Button
                type="button"
                disabled={close.isPending}
                onClick={() =>
                  void close.mutateAsync(purchaseId).then(() => {
                    notificationService.success('Pedido encerrado.')
                    void detail.refetch()
                  })
                }
              >
                Encerrar
              </Button>
            ) : null}
            {(['draft', 'sent', 'confirmed', 'approved'] as const).includes(
              order.status as 'draft' | 'sent' | 'confirmed' | 'approved',
            ) && can('purchasing.orders.cancel') ? (
              <Button
                type="button"
                variant="secondary"
                disabled={cancel.isPending}
                onClick={() =>
                  void cancel.mutateAsync(purchaseId).then(() => {
                    notificationService.success('Pedido cancelado.')
                    void detail.refetch()
                  })
                }
              >
                Cancelar
              </Button>
            ) : null}
            {order.status !== 'archived' && can('purchase.archive') ? (
              <Button
                type="button"
                variant="secondary"
                disabled={archive.isPending}
                onClick={() =>
                  void archive.mutateAsync(purchaseId).then(() => {
                    notificationService.success('Pedido arquivado.')
                    void detail.refetch()
                  })
                }
              >
                Arquivar
              </Button>
            ) : null}
            {order.status === 'archived' && can('purchase.restore') ? (
              <Button
                type="button"
                disabled={restore.isPending}
                onClick={() =>
                  void restore.mutateAsync(purchaseId).then(() => {
                    notificationService.success('Pedido restaurado.')
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

      {order.notes ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 text-sm">
          <div className="font-medium">Observações</div>
          <p className="mt-1 whitespace-pre-wrap text-[var(--color-text-secondary)]">
            {order.notes}
          </p>
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Itens</h2>
          {editable ? (
            <FeatureGate permission="purchase.items.manage">
              <Button type="button" onClick={() => { resetItemForm(); setAddOpen(true) }}>
                Adicionar item
              </Button>
            </FeatureGate>
          ) : null}
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="Sem itens"
            description={
              editable
                ? 'Adicione variantes ao pedido enquanto estiver em rascunho.'
                : 'Este pedido não possui itens.'
            }
          />
        ) : (
          <EntityTable
            headers={[
              'Produto',
              'Qtd',
              'Preço unit.',
              'Desconto',
              'Total',
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
                  {item.quantity} {item.unitCode}
                </EntityCell>
                <EntityCell>{formatTotal(item.currency, item.unitPrice)}</EntityCell>
                <EntityCell>{formatTotal(item.currency, item.discount)}</EntityCell>
                <EntityCell>{formatTotal(item.currency, item.total)}</EntityCell>
                {editable ? (
                  <EntityCell>
                    <FeatureGate permission="purchase.items.manage">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => openEdit(item)}
                        >
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => void handleRemoveItem(item)}
                        >
                          Remover
                        </Button>
                      </div>
                    </FeatureGate>
                  </EntityCell>
                ) : null}
              </EntityRow>
            ))}
          </EntityTable>
        )}
      </section>

      <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
        <h2 className="text-base font-semibold">Totais</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[var(--color-text-secondary)]">Subtotal</dt>
            <dd className="font-medium">
              {formatTotal(order.totals.currency, order.totals.subtotal)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-secondary)]">Descontos</dt>
            <dd className="font-medium">
              {formatTotal(order.totals.currency, order.totals.discountTotal)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--color-text-secondary)]">Total geral</dt>
            <dd className="text-lg font-semibold">
              {formatTotal(order.totals.currency, order.totals.grandTotal)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Histórico</h2>
        {history.isLoading ? (
          <PageLoading label="Carregando histórico…" />
        ) : (history.data ?? []).length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">Nenhum evento registrado.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {(history.data ?? []).map((entry) => (
              <li
                key={entry.id}
                className="rounded border border-[var(--color-border)] px-3 py-2"
              >
                <div className="font-medium">{entry.action}</div>
                <div className="text-[var(--color-text-secondary)]">
                  {formatDateTime(entry.createdAt)}
                  {entry.reason ? ` · ${entry.reason}` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogTitle>Adicionar item</DialogTitle>
          <DialogDescription>
            Informe a variante e quantidade. Preço opcional — usa lista de preços quando disponível.
          </DialogDescription>
          <ItemForm
            variantId={variantId}
            setVariantId={setVariantId}
            quantity={quantity}
            setQuantity={setQuantity}
            priceListId={priceListId}
            setPriceListId={setPriceListId}
            priceLists={priceLists.data?.items ?? []}
            unitPrice={unitPrice}
            setUnitPrice={setUnitPrice}
            discount={discount}
            setDiscount={setDiscount}
            description={description}
            setDescription={setDescription}
            fieldErrors={fieldErrors}
            formError={formError}
            submitting={addItem.isPending}
            submitLabel="Adicionar"
            onSubmit={() => void handleAddItem()}
            onCancel={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editItem)} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogTitle>Editar item</DialogTitle>
          <DialogDescription>{editItem?.variantName}</DialogDescription>
          <ItemForm
            variantId={variantId}
            setVariantId={setVariantId}
            variantReadOnly
            quantity={quantity}
            setQuantity={setQuantity}
            priceListId={priceListId}
            setPriceListId={setPriceListId}
            priceLists={priceLists.data?.items ?? []}
            unitPrice={unitPrice}
            setUnitPrice={setUnitPrice}
            discount={discount}
            setDiscount={setDiscount}
            description={description}
            setDescription={setDescription}
            fieldErrors={fieldErrors}
            formError={formError}
            submitting={updateItem.isPending}
            submitLabel="Salvar"
            onSubmit={() => void handleUpdateItem()}
            onCancel={() => setEditItem(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ItemForm({
  variantId,
  setVariantId,
  variantReadOnly,
  quantity,
  setQuantity,
  priceListId,
  setPriceListId,
  priceLists,
  unitPrice,
  setUnitPrice,
  discount,
  setDiscount,
  description,
  setDescription,
  fieldErrors,
  formError,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  variantId: string
  setVariantId: (v: string) => void
  variantReadOnly?: boolean
  quantity: string
  setQuantity: (v: string) => void
  priceListId: string
  setPriceListId: (v: string) => void
  priceLists: Array<{ id: string; name: string; code: string; currency: string }>
  unitPrice: string
  setUnitPrice: (v: string) => void
  discount: string
  setDiscount: (v: string) => void
  description: string
  setDescription: (v: string) => void
  fieldErrors: Record<string, string>
  formError: string | null
  submitting?: boolean
  submitLabel: string
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-4">
      {formError ? (
        <p className="text-sm text-[var(--color-danger)]">{formError}</p>
      ) : null}
      <FormField label="ID da variante" error={fieldErrors.variantId}>
        <Input
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          readOnly={variantReadOnly}
          placeholder="Código da variante"
        />
      </FormField>
      <FormField label="Quantidade" error={fieldErrors.quantity}>
        <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </FormField>
      {!variantReadOnly ? (
        <FormField label="Tabela de preço" error={fieldErrors.priceListId}>
          <Select value={priceListId} onChange={(e) => setPriceListId(e.target.value)}>
            <option value="">Selecione</option>
            {priceLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.name} · {list.code} · {list.currency}
              </option>
            ))}
          </Select>
        </FormField>
      ) : null}
      <FormField label="Preço unitário (opcional)" error={fieldErrors.unitPrice}>
        <Input value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
      </FormField>
      <FormField label="Desconto" error={fieldErrors.discount}>
        <Input value={discount} onChange={(e) => setDiscount(e.target.value)} />
      </FormField>
      <FormField label="Descrição" error={fieldErrors.description}>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </FormField>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="button" disabled={submitting} onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
