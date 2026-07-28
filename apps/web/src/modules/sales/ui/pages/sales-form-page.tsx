import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { formatBRL } from '#/lib/format'
import { useResolvedPrice } from '#/modules/catalog/ui/hooks/use-catalog-pricing'
import { CustomerEntityPicker } from '#/modules/customers/ui/components/customer-entity-picker'
import type { CustomerListItem } from '#/modules/customers/domain/types'
import type { SalesDocumentType, SalesItemInput } from '#/modules/sales'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { RequirePermission, usePermission } from '#/platform/permissions'
import {
  useCreateQuotation,
  useCreateSalesOrder,
  useSalesDocument,
  useUpdateQuotation,
  useUpdateSalesOrder,
  useTransitionSalesOrder,
} from '../use-sales'
import { decimalToCents, lineTotalCents } from '../sales-money'
import {
  DeliverySection,
  NotesSection,
  OrderHeader,
  PaymentSection,
  SalesTotals,
  WorkspaceSection,
} from '../components/sales-order-workspace-components'
import { SalesProductPicker } from '../components/sales-product-picker'
import { UnsavedChangesGuard } from '../components/unsaved-changes-guard'
import { listSalesBranches, listSalesPaymentTerms } from '../sales-api'

type Line = SalesItemInput & {
  productId: string
  productName?: string
  variantSku?: string | null
  priceSourceLabel?: string
}

const emptyLine = (): Line => ({
  productId: '',
  productName: '',
  variantId: '',
  variantSku: '',
  quantity: '1',
  unitPrice: '0',
  discount: '0',
  description: '',
  priceListId: null,
  priceSourceLabel: 'Manual',
})

export function SalesFormPage({ type, id }: { type: SalesDocumentType; id?: string }) {
  return (
    <RequirePermission permission={id ? 'sales.edit' : 'sales.create'}>
      <SalesFormContent type={type} id={id} />
    </RequirePermission>
  )
}

function SalesFormContent({ type, id }: { type: SalesDocumentType; id?: string }) {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const { can } = usePermission()
  const organizationId = currentOrganization?.id
  const isQuotation = type === 'quotation'
  const isEdit = Boolean(id)
  const detail = useSalesDocument(type, id ?? '')
  const createQuotation = useCreateQuotation()
  const createOrder = useCreateSalesOrder()
  const updateQuotation = useUpdateQuotation(id ?? '')
  const updateOrder = useUpdateSalesOrder(id ?? '')
  const transitionOrder = useTransitionSalesOrder()
  const [customer, setCustomer] = useState<CustomerListItem | null>(null)
  const [currency, setCurrency] = useState('BRL')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [branchId, setBranchId] = useState('')
  const [paymentTermId, setPaymentTermId] = useState('')
  const [lines, setLines] = useState<Line[]>([emptyLine()])
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const branches = useQuery({ queryKey: ['sales', 'branches', organizationId], enabled: Boolean(organizationId && !isQuotation), queryFn: async () => { const result = await listSalesBranches({ data: { organizationId: organizationId! } }); if (!result.ok) throw new Error(result.error.code); return result.data } })
  const paymentTerms = useQuery({ queryKey: ['sales', 'payment-terms', organizationId], enabled: Boolean(organizationId && !isQuotation), queryFn: async () => { const result = await listSalesPaymentTerms({ data: { organizationId: organizationId! } }); if (!result.ok) throw new Error(result.error.code); return result.data } })

  useEffect(() => {
    if (!detail.data || !isEdit) return
    setCustomer({
      id: detail.data.customerId,
      legalName: detail.data.customerName,
      tradeName: null,
      document: detail.data.customerDocument,
      email: detail.data.customerEmail,
      phone: detail.data.customerPhone,
      status: 'active',
      updatedAt: detail.data.createdAt,
    })
    setCurrency(detail.data.currency)
    setValidUntil(detail.data.validUntil ?? '')
    setNotes(detail.data.notes ?? '')
    setBranchId(detail.data.branchId ?? '')
    setPaymentTermId(detail.data.paymentTermId ?? '')
    setLines(
      detail.data.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        variantSku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        description: item.description ?? '',
        priceListId: item.priceListId,
        priceSourceLabel:
          item.priceSource === 'price_list'
            ? readPriceListName(item.priceRuleSnapshotJson)
            : 'Manual',
      })),
    )
  }, [detail.data, isEdit])

  useEffect(() => {
    if (!branchId && branches.data?.[0]) setBranchId(branches.data.find((branch) => branch.isDefault)?.id ?? branches.data[0].id)
  }, [branchId, branches.data])
  useEffect(() => {
    if (!paymentTermId && paymentTerms.data?.[0]) setPaymentTermId(paymentTerms.data.find((term) => term.isDefault)?.id ?? paymentTerms.data[0].id)
  }, [paymentTermId, paymentTerms.data])

  const subtotalCents = useMemo(
    () => lines.reduce((sum, line) => sum + lineTotalCents(line.quantity, line.unitPrice), 0),
    [lines],
  )
  const discountCents = useMemo(
    () => lines.reduce((sum, line) => sum + Math.max(0, decimalToCents(line.discount ?? '0')), 0),
    [lines],
  )
  const total = Math.max(0, subtotalCents - discountCents)
  const canSubmit =
    Boolean(customer?.id) &&
    total > 0 &&
    lines.every((line) => line.variantId && Number(line.quantity) > 0)
  const submitting =
    createQuotation.isPending ||
    createOrder.isPending ||
    updateQuotation.isPending ||
    updateOrder.isPending ||
    transitionOrder.isPending

  if (isEdit && detail.isLoading) return <PageLoading />
  if (isEdit && detail.isError) {
    return <PageError error={detail.error} onRetry={() => void detail.refetch()} />
  }

  async function submit(confirmOrder = false) {
    setError(null)
    try {
      if (confirmOrder && !isQuotation) {
        const { validateSalesOrderConfirmationInput } = await import('../../domain/validation')
        validateSalesOrderConfirmationInput({ branchId, paymentTermId })
      }
      const items = lines.map(({ productId: _productId, productName: _productName, variantSku: _variantSku, priceSourceLabel: _priceSourceLabel, ...line }) => ({
        ...line,
        description: line.description?.trim() || null,
        discount: line.discount || '0',
        priceListId: line.priceListId || null,
      }))
      if (isQuotation) {
        if (isEdit && id) {
          await updateQuotation.mutateAsync({ currency, validUntil: validUntil || null, notes, items })
          await navigate({ to: '/sales/quotations/$quotationId', params: { quotationId: id } })
        } else {
          const quotationId = await createQuotation.mutateAsync({ customerId: customer!.id, currency, validUntil: validUntil || null, notes, items })
          await navigate({ to: '/sales/quotations/$quotationId', params: { quotationId } })
        }
        return
      }
      if (isEdit && id) {
        await updateOrder.mutateAsync({ currency, notes, branchId: branchId || null, paymentTermId: paymentTermId || null, items })
        if (confirmOrder) {
          await transitionOrder.mutateAsync({ id, to: 'confirmed' })
        }
        setDirty(false)
        await navigate({ to: '/sales/orders/$orderId', params: { orderId: id } })
      } else {
        const orderId = await createOrder.mutateAsync({ customerId: customer!.id, currency, notes, branchId: branchId || null, paymentTermId: paymentTermId || null, items })
        if (confirmOrder) {
          await transitionOrder.mutateAsync({ id: orderId, to: 'confirmed' })
        }
        setDirty(false)
        await navigate({ to: '/sales/orders/$orderId', params: { orderId } })
      }
    } catch (event) {
      setError(event instanceof Error ? event.message : 'Não foi possível salvar o documento.')
    }
  }

  if (!isQuotation) {
    const updateLines = (updater: (current: Line[]) => Line[]) => {
      setDirty(true)
      setLines(updater)
    }

    return (
      <div className="space-y-5 pb-24">
        <UnsavedChangesGuard when={dirty && !submitting} />
        <OrderHeader
          isEdit={isEdit}
          date={new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}
          submitting={submitting}
          canSubmit={canSubmit}
          canConfirm={can('sales.confirm') && (!isEdit || detail.data?.status === 'draft')}
          onCancel={() => void navigate({ to: '/sales/orders' })}
          onSave={() => void submit()}
          onConfirm={() => void submit(true)}
        />
        <div className="mx-auto max-w-[1500px]">
          <AppBreadcrumb
            items={[
              { label: 'Vendas', href: '/sales/orders' },
              { label: 'Pedidos', href: '/sales/orders' },
              { label: isEdit ? 'Editar pedido' : 'Novo pedido' },
            ]}
          />
        </div>
        {error ? (
          <div role="alert" className="mx-auto max-w-[1500px] rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        ) : null}
        <div className="mx-auto grid max-w-[1500px] gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <main className="space-y-5">
            <WorkspaceSection
              title="Dados comerciais"
              description="Defina o cliente e o contexto monetário sem abandonar o pedido."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormField label="Cliente">
                  <CustomerEntityPicker
                    value={customer}
                    disabled={isEdit}
                    onChange={(value) => {
                      setCustomer(value)
                      setDirty(true)
                    }}
                  />
                </FormField>
                <FormField label="Moeda">
                  <Input
                    value={currency}
                    maxLength={3}
                    onChange={(event) => {
                      setCurrency(event.target.value.toUpperCase())
                      setDirty(true)
                    }}
                  />
                </FormField>
                <FormField label="Filial">
                  <select className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm" value={branchId} onChange={(event) => { setBranchId(event.target.value); setDirty(true) }} disabled={branches.isLoading}>
                    <option value="">Selecione uma filial</option>
                    {branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}{branch.isDefault ? ' (principal)' : ''}</option>)}
                  </select>
                </FormField>
                <FormField label="Condição de pagamento">
                  <select className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm" value={paymentTermId} onChange={(event) => { setPaymentTermId(event.target.value); setDirty(true) }} disabled={paymentTerms.isLoading}>
                    <option value="">Selecione uma condição</option>
                    {paymentTerms.data?.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {['Vendedor não atribuído', 'Canal não configurado', 'Lista aplicada por item'].map((label) => (
                  <div key={label} className="rounded-[var(--radius-md)] bg-[var(--color-background)] px-3 py-2 text-xs text-[var(--color-muted)]">
                    {label}
                  </div>
                ))}
              </div>
            </WorkspaceSection>

            <WorkspaceSection
              title="Itens do pedido"
              description="Busque por SKU, código de barras, produto ou variante. O Pricing resolve o valor vigente no servidor."
            >
              <div className="mb-4 flex justify-end">
                <Button variant="secondary" onClick={() => updateLines((current) => [...current, emptyLine()])}>
                  Adicionar item
                </Button>
              </div>
              <div className="overflow-x-auto">
                <EntityTable headers={['Busca', 'Produto', 'Qtd.', 'Preço', 'Desconto', 'Origem', '']}>
                  {lines.map((line, index) => (
                    <SalesItemRow
                      key={index}
                      currency={currency}
                      organizationId={organizationId}
                      line={line}
                      onChange={(next) => {
                        const duplicate = lines.some(
                          (item, itemIndex) =>
                            itemIndex !== index &&
                            item.variantId &&
                            item.variantId === next.variantId,
                        )
                        if (duplicate) {
                          setError('Esta variante já está no pedido. Ajuste a quantidade do item existente.')
                          return
                        }
                        setError(null)
                        updateLines((current) =>
                          current.map((item, itemIndex) => (itemIndex === index ? next : item)),
                        )
                      }}
                      onRemove={() =>
                        updateLines((current) => current.filter((_, itemIndex) => itemIndex !== index))
                      }
                      removable={lines.length > 1}
                    />
                  ))}
                </EntityTable>
              </div>
            </WorkspaceSection>
            <PaymentSection paymentTermName={paymentTerms.data?.find((term) => term.id === paymentTermId)?.name} />
            <DeliverySection />
            <NotesSection
              value={notes}
              onChange={(value) => {
                setNotes(value)
                setDirty(true)
              }}
            />
          </main>
          <SalesTotals
            itemCount={lines.filter((line) => line.variantId).length}
            subtotalCents={subtotalCents}
            discountCents={discountCents}
            currency={currency}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: 'Vendas', href: '/sales/orders' },
          { label: isQuotation ? 'Orçamentos' : 'Pedidos', href: isQuotation ? '/sales/quotations' : '/sales/orders' },
          { label: isEdit ? 'Editar' : 'Novo' },
        ]}
      />
      <PageHeader
        title={`${isEdit ? 'Editar' : 'Novo'} ${isQuotation ? 'orçamento' : 'pedido de venda'}`}
        description="Busque cliente e itens. Ao selecionar uma variante, o preço vigente é sugerido pelo Pricing."
      />
      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
      <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 md:grid-cols-3">
        <FormField label="Cliente">
          <CustomerEntityPicker
            value={customer}
            disabled={isEdit}
            onChange={setCustomer}
          />
        </FormField>
        <FormField label="Moeda">
          <Input value={currency} maxLength={3} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
        </FormField>
        {isQuotation ? (
          <FormField label="Validade">
            <Input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
          </FormField>
        ) : null}
        <FormField label="Observações" className="md:col-span-3">
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </FormField>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Itens</h2>
          <Button variant="secondary" onClick={() => setLines((current) => [...current, emptyLine()])}>
            Adicionar item
          </Button>
        </div>
        <EntityTable headers={['Busca', 'Item selecionado', 'Qtd.', 'Preço', 'Desconto', 'Origem', '']}>
          {lines.map((line, index) => (
            <SalesItemRow
              key={index}
              currency={currency}
              organizationId={organizationId}
              line={line}
              onChange={(next) => setLines((current) => current.map((item, itemIndex) => (itemIndex === index ? next : item)))}
              onRemove={() => setLines((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              removable={lines.length > 1}
            />
          ))}
        </EntityTable>
      </section>
      <section className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs text-[var(--color-muted)]">Total comercial</div>
          <div className="text-xl font-semibold">{formatBRL(total / 100)}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void navigate({ to: isQuotation ? '/sales/quotations' : '/sales/orders' })}>
            Cancelar
          </Button>
          <Button disabled={submitting || !canSubmit} onClick={() => void submit()}>
            Salvar
          </Button>
        </div>
      </section>
    </div>
  )
}

function readPriceListName(snapshotJson: string) {
  try {
    const parsed = JSON.parse(snapshotJson) as { priceListName?: string }
    return parsed.priceListName ?? 'Lista de preço'
  } catch {
    return 'Lista de preço'
  }
}

function SalesItemRow({
  organizationId,
  currency,
  line,
  onChange,
  onRemove,
  removable,
}: {
  organizationId: string | undefined
  currency: string
  line: Line
  onChange: (line: Line) => void
  onRemove: () => void
  removable: boolean
}) {
  const [priceAt] = useState(() => new Date().toISOString())
  const price = useResolvedPrice(
    organizationId,
    line.variantId ? { variantId: line.variantId, at: priceAt, currency } : undefined,
    Boolean(line.variantId),
  )

  useEffect(() => {
    if (!price.data) return
    if (line.priceListId === null && line.unitPrice !== '0') return
    if (line.unitPrice === price.data.amount && line.priceListId === price.data.priceListId) return
    onChange({
      ...line,
      unitPrice: price.data.amount,
      priceListId: price.data.priceListId,
      priceSourceLabel: price.data.priceListName,
    })
  }, [line, onChange, price.data])

  return (
    <EntityRow>
      <EntityCell>
        <SalesProductPicker
          organizationId={organizationId}
          value={
            line.variantId
              ? {
                  productId: line.productId,
                  productName: line.productName ?? '',
                  variantId: line.variantId,
                  variantSku: line.variantSku ?? null,
                  brandId: null,
                  categoryId: null,
                  status: 'active',
                }
              : null
          }
          onSelect={(selected) => {
            onChange({
              ...line,
              productId: selected.productId,
              productName: selected.productName,
              variantId: selected.variantId,
              variantSku: selected.variantSku,
              priceListId: null,
              unitPrice: '0',
              priceSourceLabel: 'Buscando preço…',
            })
          }}
        />
      </EntityCell>
      <EntityCell>
        <div className="font-medium">{line.productName || 'Nenhum item'}</div>
        <div className="text-xs text-[var(--color-muted)]">{line.variantSku || 'Selecione uma variante vendável'}</div>
      </EntityCell>
      <EntityCell>
        <Input inputMode="decimal" value={line.quantity} onChange={(event) => onChange({ ...line, quantity: event.target.value })} />
      </EntityCell>
      <EntityCell>
        <Input
          inputMode="decimal"
          value={line.unitPrice}
          onChange={(event) => onChange({ ...line, unitPrice: event.target.value, priceListId: null, priceSourceLabel: 'Manual' })}
        />
      </EntityCell>
      <EntityCell>
        <Input inputMode="decimal" value={line.discount ?? '0'} onChange={(event) => onChange({ ...line, discount: event.target.value })} />
      </EntityCell>
      <EntityCell>
        <span className="text-sm">{price.isError ? 'Manual' : line.priceSourceLabel ?? 'Manual'}</span>
      </EntityCell>
      <EntityCell>
        <Button variant="ghost" disabled={!removable} onClick={onRemove}>
          Remover
        </Button>
      </EntityCell>
    </EntityRow>
  )
}
