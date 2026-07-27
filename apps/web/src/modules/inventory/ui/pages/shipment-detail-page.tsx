import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { formatBRL, formatDateTime } from '#/lib/format'
import {
  shipmentStatusLabel,
  type InventoryShipmentDetail,
} from '#/modules/inventory'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission } from '#/platform/permissions'
import {
  useCancelInventoryShipment,
  useCompleteInventoryShipment,
  useDispatchInventoryShipment,
  useInventoryShipment,
  useMarkInventoryShipmentReady,
} from '../hooks/use-inventory-shipments'

export function ShipmentDetailPage({ shipmentId }: { shipmentId: string }) {
  return (
    <RequirePermission
      permission="shipment.read"
      forbiddenDescription="Você não tem permissão para ver esta expedição."
    >
      <ShipmentDetailContent shipmentId={shipmentId} />
    </RequirePermission>
  )
}

function ShipmentDetailContent({ shipmentId }: { shipmentId: string }) {
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const shipment = useInventoryShipment(organizationId, shipmentId)
  const markReady = useMarkInventoryShipmentReady(organizationId)
  const dispatch = useDispatchInventoryShipment(organizationId)
  const complete = useCompleteInventoryShipment(organizationId)
  const cancel = useCancelInventoryShipment(organizationId)
  const [reason, setReason] = useState('')
  const [logistics, setLogistics] = useState({
    carrier: '',
    service: '',
    trackingCode: '',
    freightAmount: '',
    estimatedDeliveryDate: '',
    notes: '',
  })

  useEffect(() => {
    if (!shipment.data) return
    setLogistics({
      carrier: shipment.data.carrier ?? '',
      service: shipment.data.service ?? '',
      trackingCode: shipment.data.trackingCode ?? '',
      freightAmount: shipment.data.freightAmount ?? '',
      estimatedDeliveryDate: shipment.data.estimatedDeliveryDate ?? '',
      notes: shipment.data.notes ?? '',
    })
  }, [shipment.data])

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }
  if (shipment.isLoading) return <PageLoading />
  if (shipment.isError || !shipment.data) {
    return (
      <PageError
        error={shipment.error ?? new Error('shipment_not_found')}
        onRetry={() => void shipment.refetch()}
      />
    )
  }

  const document = shipment.data
  const busy =
    markReady.isPending ||
    dispatch.isPending ||
    complete.isPending ||
    cancel.isPending
  const canEditLogistics = document.status === 'draft'

  async function readyShipment() {
    await markReady.mutateAsync({
      shipmentId: document.id,
      carrier: logistics.carrier || null,
      service: logistics.service || null,
      trackingCode: logistics.trackingCode || null,
      freightAmount: logistics.freightAmount || null,
      estimatedDeliveryDate: logistics.estimatedDeliveryDate || null,
      notes: logistics.notes || null,
    })
    await shipment.refetch()
  }

  async function dispatchShipment() {
    await dispatch.mutateAsync({ shipmentId: document.id })
    await shipment.refetch()
  }

  async function completeShipment() {
    await complete.mutateAsync({ shipmentId: document.id })
    await shipment.refetch()
  }

  async function cancelShipment() {
    await cancel.mutateAsync({
      shipmentId: document.id,
      reason: reason || null,
    })
    setReason('')
    await shipment.refetch()
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: 'Central', href: '/' },
          { label: 'Estoque', href: '/catalog/inventory/items' },
          { label: 'Expedições', href: '/catalog/inventory/shipments' },
          { label: document.number },
        ]}
      />
      <PageHeader
        title={document.number}
        description={`${document.sourceNumber} · ${document.customerName}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={shipmentStatusLabel(document.status)} />
            <Actions
              document={document}
              reason={reason}
              setReason={setReason}
              busy={busy}
              onReady={readyShipment}
              onDispatch={dispatchShipment}
              onComplete={completeShipment}
              onCancel={cancelShipment}
            />
          </div>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Cliente" value={document.customerName} />
        <Metric label="Pedido" value={document.sourceNumber} />
        <Metric label="Embalagem" value={document.packingNumber} />
        <Metric label="Despachado" value={formatQuantity(document.totalQuantityShipped)} />
        <Metric label="Status" value={shipmentStatusLabel(document.status)} />
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-semibold">Itens expedidos</h2>
            <EntityTable
              headers={[
                'Produto',
                'SKU',
                'Unidade',
                'Embalado',
                'A despachar',
                'Movimento',
                'Status',
              ]}
            >
              {document.items.map((item) => (
                <EntityRow key={item.id}>
                  <EntityCell>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {item.description ?? 'Snapshot da embalagem'}
                    </div>
                  </EntityCell>
                  <EntityCell mono>{item.sku}</EntityCell>
                  <EntityCell>{item.unitCode}</EntityCell>
                  <EntityCell>{formatQuantity(item.quantityPacked)}</EntityCell>
                  <EntityCell>{formatQuantity(item.quantityShipped)}</EntityCell>
                  <EntityCell mono>{item.ledgerMovementId ?? '—'}</EntityCell>
                  <EntityCell>
                    <StatusBadge status={shipmentStatusLabel(item.status)} />
                  </EntityCell>
                </EntityRow>
              ))}
            </EntityTable>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Logística</h2>
            <div className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 sm:grid-cols-2">
              <Field label="Transportadora">
                <Input
                  value={logistics.carrier}
                  onChange={(event) =>
                    setLogistics((current) => ({
                      ...current,
                      carrier: event.target.value,
                    }))
                  }
                  disabled={!canEditLogistics}
                />
              </Field>
              <Field label="Serviço">
                <Input
                  value={logistics.service}
                  onChange={(event) =>
                    setLogistics((current) => ({
                      ...current,
                      service: event.target.value,
                    }))
                  }
                  disabled={!canEditLogistics}
                />
              </Field>
              <Field label="Código de rastreio">
                <Input
                  value={logistics.trackingCode}
                  onChange={(event) =>
                    setLogistics((current) => ({
                      ...current,
                      trackingCode: event.target.value,
                    }))
                  }
                  disabled={!canEditLogistics}
                />
              </Field>
              <Field label="Frete">
                <Input
                  inputMode="decimal"
                  value={logistics.freightAmount}
                  onChange={(event) =>
                    setLogistics((current) => ({
                      ...current,
                      freightAmount: event.target.value,
                    }))
                  }
                  disabled={!canEditLogistics}
                />
              </Field>
              <Field label="Previsão de entrega">
                <Input
                  type="date"
                  value={logistics.estimatedDeliveryDate}
                  onChange={(event) =>
                    setLogistics((current) => ({
                      ...current,
                      estimatedDeliveryDate: event.target.value,
                    }))
                  }
                  disabled={!canEditLogistics}
                />
              </Field>
              <Field label="Observações">
                <Input
                  value={logistics.notes}
                  onChange={(event) =>
                    setLogistics((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  disabled={!canEditLogistics}
                />
              </Field>
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Movimentos de estoque</h2>
            {document.movements.length === 0 ? (
              <p className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-text-secondary)]">
                Nenhuma saída física foi registrada. Movimentos só aparecem após
                o despacho.
              </p>
            ) : (
              <EntityTable
                headers={[
                  'Movimento',
                  'Tipo',
                  'Quantidade',
                  'Antes',
                  'Depois',
                  'Data',
                ]}
              >
                {document.movements.map((movement) => (
                  <EntityRow key={movement.id}>
                    <EntityCell mono>{movement.id}</EntityCell>
                    <EntityCell>{movement.type}</EntityCell>
                    <EntityCell>{formatQuantity(movement.quantity)}</EntityCell>
                    <EntityCell>{formatQuantity(movement.beforeQuantity)}</EntityCell>
                    <EntityCell>{formatQuantity(movement.afterQuantity)}</EntityCell>
                    <EntityCell>{formatDateTime(movement.occurredAt)}</EntityCell>
                  </EntityRow>
                ))}
              </EntityTable>
            )}
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Histórico</h2>
            <ul className="space-y-2">
              {document.history.map((entry) => (
                <li
                  className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-3 text-sm"
                  key={entry.id}
                >
                  <strong>{entry.action}</strong> · {formatDateTime(entry.createdAt)}
                  {entry.oldValue || entry.newValue
                    ? ` · ${entry.oldValue ?? '—'} → ${entry.newValue ?? '—'}`
                    : ''}
                  {entry.reason ? ` · ${entry.reason}` : ''}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="space-y-4 rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
          <h2 className="font-semibold">Resumo da expedição</h2>
          <Info label="Cliente" value={document.customerName} />
          <Info label="Documento" value={document.customerDocument ?? '—'} />
          <Info label="Contato" value={document.customerEmail ?? document.customerPhone ?? '—'} />
          <Info label="Transportadora" value={document.carrier ?? '—'} />
          <Info label="Serviço" value={document.service ?? '—'} />
          <Info label="Rastreio" value={document.trackingCode ?? '—'} />
          <Info
            label="Frete"
            value={
              document.freightAmount
                ? formatBRL(Number(document.freightAmount))
                : '—'
            }
          />
          <Info label="Despacho" value={document.dispatchDate ?? '—'} />
          <Info label="Entrega" value={document.deliveredDate ?? '—'} />
          <Link
            className="text-sm text-[var(--color-primary)] hover:underline"
            to="/catalog/inventory/packings/$packingId"
            params={{ packingId: document.packingId }}
          >
            Abrir embalagem
          </Link>
          <Link
            className="block text-sm text-[var(--color-primary)] hover:underline"
            to="/sales/orders/$orderId"
            params={{ orderId: document.sourceId }}
          >
            Abrir pedido de venda
          </Link>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Expedição baixa On Hand e Reserved apenas no despacho. Não gera
            invoice, contas a receber, recebimentos, caixa ou documento fiscal.
          </p>
        </aside>
      </section>
    </div>
  )
}

function Actions({
  document,
  reason,
  setReason,
  busy,
  onReady,
  onDispatch,
  onComplete,
  onCancel,
}: {
  document: InventoryShipmentDetail
  reason: string
  setReason: (value: string) => void
  busy: boolean
  onReady: () => Promise<void>
  onDispatch: () => Promise<void>
  onComplete: () => Promise<void>
  onCancel: () => Promise<void>
}) {
  return (
    <>
      {document.status === 'draft' ? (
        <FeatureGate permission="shipment.ready">
          <Button disabled={busy} onClick={() => void onReady()}>
            Marcar pronto
          </Button>
        </FeatureGate>
      ) : null}
      {document.status === 'ready' ? (
        <FeatureGate permission="shipment.dispatch">
          <Button disabled={busy} onClick={() => void onDispatch()}>
            Despachar
          </Button>
        </FeatureGate>
      ) : null}
      {document.status === 'dispatched' ? (
        <FeatureGate permission="shipment.complete">
          <Button disabled={busy} onClick={() => void onComplete()}>
            Confirmar entrega
          </Button>
        </FeatureGate>
      ) : null}
      {['draft', 'ready'].includes(document.status) ? (
        <FeatureGate permission="shipment.cancel">
          <Input
            className="w-48"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Motivo"
          />
          <Button
            variant="secondary"
            disabled={busy || !reason.trim()}
            onClick={() => void onCancel()}
          >
            Cancelar expedição
          </Button>
        </FeatureGate>
      ) : null}
    </>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4">
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
      <div className="mt-1 truncate text-lg font-semibold text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-xs text-[var(--color-muted)]">{label}</span>
      {children}
    </label>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
      <div className="break-all text-sm text-[var(--color-ink)]">{value}</div>
    </div>
  )
}

function formatQuantity(value: string) {
  return Number(value).toLocaleString('pt-BR', {
    maximumFractionDigits: 6,
  })
}
