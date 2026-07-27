import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { Button } from '#/components/ui/button'
import { FormField } from '#/components/ui/form-field'
import { Input } from '#/components/ui/input'
import { Select } from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { formatBRL } from '#/lib/format'
import { useCatalogVariantSearch } from '#/modules/catalog/ui/hooks/use-catalog-variants'
import { useResolvedPrice } from '#/modules/catalog/ui/hooks/use-catalog-pricing'
import { useCustomerSearch } from '#/modules/customers/ui/use-customer-queries'
import type { SalesDocumentType, SalesItemInput } from '#/modules/sales'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { RequirePermission } from '#/platform/permissions'
import {
  useCreateQuotation,
  useCreateSalesOrder,
  useSalesDocument,
  useUpdateQuotation,
  useUpdateSalesOrder,
} from '../use-sales'

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
  const organizationId = currentOrganization?.id
  const isQuotation = type === 'quotation'
  const isEdit = Boolean(id)
  const detail = useSalesDocument(type, id ?? '')
  const createQuotation = useCreateQuotation()
  const createOrder = useCreateSalesOrder()
  const updateQuotation = useUpdateQuotation(id ?? '')
  const updateOrder = useUpdateSalesOrder(id ?? '')
  const [customerId, setCustomerId] = useState('')
  const [customerLabel, setCustomerLabel] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const customerSearch = useCustomerSearch(customerQuery)
  const [currency, setCurrency] = useState('BRL')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<Line[]>([emptyLine()])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!detail.data || !isEdit) return
    setCustomerId(detail.data.customerId)
    setCustomerLabel(detail.data.customerName)
    setCurrency(detail.data.currency)
    setValidUntil(detail.data.validUntil ?? '')
    setNotes(detail.data.notes ?? '')
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

  const total = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum +
          Math.max(
            0,
            Number(line.quantity || 0) * Number(line.unitPrice || 0) -
              Number(line.discount || 0),
          ),
        0,
      ),
    [lines],
  )
  const canSubmit =
    Boolean(customerId) &&
    total > 0 &&
    lines.every((line) => line.variantId && Number(line.quantity) > 0)
  const submitting =
    createQuotation.isPending ||
    createOrder.isPending ||
    updateQuotation.isPending ||
    updateOrder.isPending

  if (isEdit && detail.isLoading) return <PageLoading />
  if (isEdit && detail.isError) {
    return <PageError error={detail.error} onRetry={() => void detail.refetch()} />
  }

  async function submit() {
    setError(null)
    try {
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
          const quotationId = await createQuotation.mutateAsync({ customerId, currency, validUntil: validUntil || null, notes, items })
          await navigate({ to: '/sales/quotations/$quotationId', params: { quotationId } })
        }
        return
      }
      if (isEdit && id) {
        await updateOrder.mutateAsync({ currency, notes, items })
        await navigate({ to: '/sales/orders/$orderId', params: { orderId: id } })
      } else {
        const orderId = await createOrder.mutateAsync({ customerId, currency, notes, items })
        await navigate({ to: '/sales/orders/$orderId', params: { orderId } })
      }
    } catch (event) {
      setError(event instanceof Error ? event.message : 'Não foi possível salvar o documento.')
    }
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
          <Input
            value={isEdit ? customerLabel : customerQuery}
            disabled={isEdit}
            onChange={(event) => {
              setCustomerQuery(event.target.value)
              setCustomerId('')
              setCustomerLabel('')
            }}
            placeholder="Busque por nome, documento ou e-mail"
          />
          {!isEdit && customerSearch.data?.length ? (
            <div className="mt-2 max-h-36 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border-soft)]">
              {customerSearch.data.map((customer) => (
                <button
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-hover)]"
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    setCustomerId(customer.id)
                    setCustomerLabel(customer.legalName)
                    setCustomerQuery(customer.legalName)
                  }}
                >
                  {customer.legalName}
                  {customer.document ? <span className="text-[var(--color-muted)]"> · {customer.document}</span> : null}
                </button>
              ))}
            </div>
          ) : null}
          {customerId ? <p className="mt-1 text-xs text-[var(--color-muted)]">Selecionado: {customerLabel}</p> : null}
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
          <div className="text-xl font-semibold">{formatBRL(total)}</div>
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
  const [query, setQuery] = useState('')
  const [priceAt] = useState(() => new Date().toISOString())
  const variants = useCatalogVariantSearch(organizationId, query)
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
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="SKU, barcode, produto ou variante"
        />
        {variants.data?.length ? (
          <Select
            className="mt-2"
            value=""
            onChange={(event) => {
              const selected = variants.data.find((item) => item.variantId === event.target.value)
              if (!selected) return
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
              setQuery(selected.variantSku ?? selected.productName)
            }}
          >
            <option value="">Selecionar resultado</option>
            {variants.data.map((item) => (
              <option key={item.variantId} value={item.variantId}>
                {item.variantSku ? `${item.variantSku} · ` : ''}{item.productName}
              </option>
            ))}
          </Select>
        ) : null}
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
