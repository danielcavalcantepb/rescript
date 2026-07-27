import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { formatBRL, formatDateTime } from '#/lib/format'
import {
  quotationStatusLabel,
  salesOrderStatusLabel,
  type QuotationStatus,
  type SalesDocumentDetail,
  type SalesDocumentType,
  type SalesOrderStatus,
} from '#/modules/sales'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission } from '#/platform/permissions'
import { useCreateInventoryReservation } from '#/modules/inventory/ui/hooks/use-inventory-reservations'
import {
  useCreateInventoryPicking,
  useInventoryPickings,
} from '#/modules/inventory/ui/hooks/use-inventory-pickings'
import {
  useCreateInventoryPacking,
  useInventoryPackings,
} from '#/modules/inventory/ui/hooks/use-inventory-packings'
import { useCreateInventoryShipment } from '#/modules/inventory/ui/hooks/use-inventory-shipments'
import {
  useConvertQuotationToSalesOrder,
  useSalesDocument,
  useTransitionQuotation,
  useTransitionSalesOrder,
} from '../use-sales'

export function SalesDocumentPage({ type, id }: { type: SalesDocumentType; id: string }) {
  return (
    <RequirePermission permission="sales.read">
      <SalesDocumentContent type={type} id={id} />
    </RequirePermission>
  )
}

function SalesDocumentContent({ type, id }: { type: SalesDocumentType; id: string }) {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const query = useSalesDocument(type, id)
  const quotationTransition = useTransitionQuotation()
  const orderTransition = useTransitionSalesOrder()
  const convert = useConvertQuotationToSalesOrder()
  const createReservation = useCreateInventoryReservation(currentOrganization?.id)
  const createPicking = useCreateInventoryPicking(currentOrganization?.id)
  const createPacking = useCreateInventoryPacking(currentOrganization?.id)
  const createShipment = useCreateInventoryShipment(currentOrganization?.id)
  const relatedPickings = useInventoryPickings(
    currentOrganization?.id,
    { q: query.data?.number, limit: 10 },
    Boolean(currentOrganization?.id && query.data?.number && type === 'sales_order'),
  )
  const relatedPackings = useInventoryPackings(
    currentOrganization?.id,
    { q: query.data?.number, limit: 10 },
    Boolean(currentOrganization?.id && query.data?.number && type === 'sales_order'),
  )
  const [reason, setReason] = useState('')

  if (query.isLoading) return <PageLoading />
  if (query.isError) return <PageError error={query.error} onRetry={() => void query.refetch()} />
  if (!query.data) return null

  const document = query.data
  const isQuotation = type === 'quotation'
  const statusLabel = isQuotation
    ? quotationStatusLabel(document.status as QuotationStatus)
    : salesOrderStatusLabel(document.status as SalesOrderStatus)
  const completedPicking = !isQuotation
    ? relatedPickings.data?.find(
        (picking) =>
          picking.sourceId === document.id && picking.status === 'completed',
      )
    : undefined
  const completedPacking = !isQuotation
    ? relatedPackings.data?.find(
        (packing) =>
          packing.sourceId === document.id && packing.status === 'completed',
      )
    : undefined

  async function transition(to: string) {
    if (isQuotation) {
      await quotationTransition.mutateAsync({ id, to, reason: reason || null })
    } else {
      await orderTransition.mutateAsync({ id, to, reason: reason || null })
    }
    setReason('')
    await query.refetch()
  }

  async function convertToOrder() {
    const orderId = await convert.mutateAsync(id)
    await navigate({ to: '/sales/orders/$orderId', params: { orderId } })
  }

  async function createReservationFromOrder() {
    const reservationId = await createReservation.mutateAsync({
      salesOrderId: id,
    })
    await navigate({
      to: '/catalog/inventory/reservations/$reservationId',
      params: { reservationId },
    })
  }

  async function openPickingFromOrder() {
    const reservationId = await createReservation.mutateAsync({
      salesOrderId: id,
    })
    const pickingId = await createPicking.mutateAsync({
      reservationId,
    })
    await navigate({
      to: '/catalog/inventory/pickings/$pickingId',
      params: { pickingId },
    })
  }

  async function openPackingFromOrder() {
    if (!completedPicking) throw new Error('completed_picking_not_found')
    const packingId = await createPacking.mutateAsync({
      pickingId: completedPicking.id,
    })
    await navigate({
      to: '/catalog/inventory/packings/$packingId',
      params: { packingId },
    })
  }

  async function openShipmentFromOrder() {
    if (!completedPacking) throw new Error('completed_packing_not_found')
    const shipmentId = await createShipment.mutateAsync({
      packingId: completedPacking.id,
    })
    await navigate({
      to: '/catalog/inventory/shipments/$shipmentId',
      params: { shipmentId },
    })
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: 'Vendas', href: '/sales/orders' },
          { label: isQuotation ? 'Orçamentos' : 'Pedidos', href: isQuotation ? '/sales/quotations' : '/sales/orders' },
          { label: document.number },
        ]}
      />
      <PageHeader
        title={document.number}
        description={`${document.customerName}${document.customerDocument ? ` · ${document.customerDocument}` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={statusLabel} />
            <Actions
              document={document}
              type={type}
              reason={reason}
              setReason={setReason}
              onTransition={transition}
              onConvert={convertToOrder}
              busy={
                quotationTransition.isPending ||
                orderTransition.isPending ||
                convert.isPending ||
                createReservation.isPending ||
                createPicking.isPending ||
                createPacking.isPending ||
                createShipment.isPending
              }
              onCreateReservation={createReservationFromOrder}
              onOpenPicking={openPickingFromOrder}
              canOpenPacking={Boolean(completedPicking)}
              onOpenPacking={openPackingFromOrder}
              canOpenShipment={Boolean(completedPacking)}
              onOpenShipment={openShipmentFromOrder}
            />
          </div>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card label="Cliente" value={document.customerName} />
        <Card label="Total" value={formatBRL(Number(document.grandTotal))} />
        <Card label="Descontos" value={formatBRL(Number(document.discountTotal))} />
        <Card label="Itens" value={String(document.items.length)} />
        <Card label="Status" value={statusLabel} />
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-semibold">Itens</h2>
            <EntityTable headers={['Produto', 'SKU', 'Unidade', 'Qtd.', 'Preço', 'Desconto', 'Total']}>
              {document.items.map((item) => (
                <EntityRow key={item.id}>
                  <EntityCell>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-[var(--color-muted)]">{item.description ?? 'Snapshot comercial'}</div>
                  </EntityCell>
                  <EntityCell mono>{item.sku}</EntityCell>
                  <EntityCell>{item.unitCode}</EntityCell>
                  <EntityCell>{Number(item.quantity).toLocaleString('pt-BR')}</EntityCell>
                  <EntityCell>{formatBRL(Number(item.unitPrice))}</EntityCell>
                  <EntityCell>{formatBRL(Number(item.discount))}</EntityCell>
                  <EntityCell>{formatBRL(Number(item.total))}</EntityCell>
                </EntityRow>
              ))}
            </EntityTable>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Histórico</h2>
            <ul className="space-y-2">
              {document.history.map((entry) => (
                <li className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3 text-sm" key={entry.id}>
                  <strong>{entry.action}</strong> · {formatDateTime(entry.createdAt)}
                  {entry.oldValue || entry.newValue ? ` · ${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}` : ''}
                  {entry.reason ? ` · ${entry.reason}` : ''}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
          <h2 className="font-semibold">Resumo comercial</h2>
          <Info label="Cliente" value={document.customerName} />
          <Info label="Contato" value={document.customerEmail ?? document.customerPhone ?? '—'} />
          <Info label="Subtotal" value={formatBRL(Number(document.subtotal))} />
          <Info label="Total" value={formatBRL(Number(document.grandTotal))} />
          <Info label="Moeda" value={document.currency} />
          {isQuotation ? <Info label="Validade" value={document.validUntil ?? '—'} /> : null}
          {document.quotationId ? (
            <Link className="text-sm text-[var(--color-primary)] hover:underline" to="/sales/quotations/$quotationId" params={{ quotationId: document.quotationId }}>
              Abrir orçamento de origem
            </Link>
          ) : null}
          {document.notes ? (
            <div>
              <div className="text-xs text-[var(--color-muted)]">Observações</div>
              <p className="text-sm text-[var(--color-ink)]">{document.notes}</p>
            </div>
          ) : null}
        </aside>
      </section>
    </div>
  )
}

function Actions({
  document,
  type,
  reason,
  setReason,
  onTransition,
  onConvert,
  onCreateReservation,
  onOpenPicking,
  canOpenPacking,
  onOpenPacking,
  canOpenShipment,
  onOpenShipment,
  busy,
}: {
  document: SalesDocumentDetail
  type: SalesDocumentType
  reason: string
  setReason: (value: string) => void
  onTransition: (to: string) => Promise<void>
  onConvert: () => Promise<void>
  onCreateReservation: () => Promise<void>
  onOpenPicking: () => Promise<void>
  canOpenPacking: boolean
  onOpenPacking: () => Promise<void>
  canOpenShipment: boolean
  onOpenShipment: () => Promise<void>
  busy: boolean
}) {
  const isQuotation = type === 'quotation'
  const editTo = isQuotation ? '/sales/quotations/$quotationId/edit' : '/sales/orders/$orderId/edit'
  const editParams = isQuotation ? { quotationId: document.id } : { orderId: document.id }
  return (
    <>
      {document.status === 'draft' ? (
        <FeatureGate permission="sales.send">
          <Button variant="secondary" asChild>
            <Link to={editTo} params={editParams}>Editar</Link>
          </Button>
        </FeatureGate>
      ) : null}
      {isQuotation && document.status === 'draft' ? (
        <FeatureGate permission="sales.edit">
          <Button disabled={busy} onClick={() => void onTransition('sent')}>Enviar</Button>
        </FeatureGate>
      ) : null}
      {isQuotation && document.status === 'sent' ? (
        <>
          <FeatureGate permission="sales.approve">
            <Button disabled={busy} onClick={() => void onTransition('approved')}>Aprovar</Button>
          </FeatureGate>
          <FeatureGate permission="sales.reject">
            <Input className="w-44" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo" />
            <Button variant="secondary" disabled={busy || !reason.trim()} onClick={() => void onTransition('rejected')}>Rejeitar</Button>
            <Button variant="secondary" disabled={busy} onClick={() => void onTransition('expired')}>Expirar</Button>
          </FeatureGate>
        </>
      ) : null}
      {isQuotation && document.status === 'approved' ? (
        <FeatureGate permission="sales.convert">
          <Button disabled={busy} onClick={() => void onConvert()}>Gerar pedido</Button>
        </FeatureGate>
      ) : null}
      {!isQuotation && document.status === 'draft' ? (
        <FeatureGate permission="sales.confirm">
          <Button disabled={busy} onClick={() => void onTransition('confirmed')}>Confirmar</Button>
        </FeatureGate>
      ) : null}
      {!isQuotation && document.status === 'confirmed' ? (
        <FeatureGate permission="reservation.create">
          <Button disabled={busy} onClick={() => void onCreateReservation()}>Abrir reserva</Button>
        </FeatureGate>
      ) : null}
      {!isQuotation && document.status === 'confirmed' ? (
        <FeatureGate permission="picking.create">
          <Button variant="secondary" disabled={busy} onClick={() => void onOpenPicking()}>Abrir Picking</Button>
        </FeatureGate>
      ) : null}
      {!isQuotation && document.status === 'confirmed' && canOpenPacking ? (
        <FeatureGate permission="packing.create">
          <Button variant="secondary" disabled={busy} onClick={() => void onOpenPacking()}>Abrir Packing</Button>
        </FeatureGate>
      ) : null}
      {!isQuotation && document.status === 'confirmed' && canOpenShipment ? (
        <FeatureGate permission="shipment.create">
          <Button variant="secondary" disabled={busy} onClick={() => void onOpenShipment()}>Abrir Shipment</Button>
        </FeatureGate>
      ) : null}
      {!isQuotation && ['draft', 'confirmed'].includes(document.status) ? (
        <FeatureGate permission="sales.cancel">
          <Input className="w-44" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo" />
          <Button variant="secondary" disabled={busy || !reason.trim()} onClick={() => void onTransition('cancelled')}>Cancelar</Button>
        </FeatureGate>
      ) : null}
      {canArchive(type, document.status) ? (
        <FeatureGate permission="sales.archive">
          <Button variant="secondary" disabled={busy} onClick={() => void onTransition('archived')}>Arquivar</Button>
        </FeatureGate>
      ) : null}
    </>
  )
}

function canArchive(type: SalesDocumentType, status: string) {
  if (type === 'quotation') return ['draft', 'approved', 'rejected', 'expired'].includes(status)
  return ['draft', 'cancelled'].includes(status)
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
      <div className="mt-1 truncate text-lg font-semibold text-[var(--color-ink)]">{value}</div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
      <div className="text-sm text-[var(--color-ink)]">{value}</div>
    </div>
  )
}
