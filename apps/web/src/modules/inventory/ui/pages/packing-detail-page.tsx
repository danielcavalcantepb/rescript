import { Link, useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { formatDateTime } from '#/lib/format'
import {
  packingStatusLabel,
  type InventoryPackingDetail,
} from '#/modules/inventory'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission } from '#/platform/permissions'
import { useState } from 'react'
import {
  useCancelInventoryPacking,
  useCompleteInventoryPacking,
  useInventoryPacking,
  useStartInventoryPacking,
} from '../hooks/use-inventory-packings'
import {
  useCreateInventoryShipment,
  useInventoryShipments,
} from '../hooks/use-inventory-shipments'

export function PackingDetailPage({ packingId }: { packingId: string }) {
  return (
    <RequirePermission
      permission="packing.read"
      forbiddenDescription="Você não tem permissão para ver esta embalagem."
    >
      <PackingDetailContent packingId={packingId} />
    </RequirePermission>
  )
}

function PackingDetailContent({ packingId }: { packingId: string }) {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const packing = useInventoryPacking(organizationId, packingId)
  const relatedShipments = useInventoryShipments(
    organizationId,
    { q: packing.data?.number, limit: 10 },
    Boolean(organizationId && packing.data?.number),
  )
  const createShipment = useCreateInventoryShipment(organizationId)
  const start = useStartInventoryPacking(organizationId)
  const complete = useCompleteInventoryPacking(organizationId)
  const cancel = useCancelInventoryPacking(organizationId)
  const [reason, setReason] = useState('')

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }
  if (packing.isLoading) return <PageLoading />
  if (packing.isError || !packing.data) {
    return (
      <PageError
        error={packing.error ?? new Error('packing_not_found')}
        onRetry={() => void packing.refetch()}
      />
    )
  }

  const document = packing.data
  const busy =
    start.isPending ||
    complete.isPending ||
    cancel.isPending ||
    createShipment.isPending
  const hasShipment = relatedShipments.data?.some(
    (shipment) => shipment.packingId === document.id,
  )

  async function startPacking() {
    await start.mutateAsync(document.id)
    await packing.refetch()
  }

  async function completePacking() {
    await complete.mutateAsync(document.id)
    await packing.refetch()
  }

  async function cancelPacking() {
    await cancel.mutateAsync({
      packingId: document.id,
      reason: reason || null,
    })
    setReason('')
    await packing.refetch()
  }

  async function createShipmentFromPacking() {
    const shipmentId = await createShipment.mutateAsync({
      packingId: document.id,
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
          { label: 'Central', href: '/' },
          { label: 'Estoque', href: '/catalog/inventory/items' },
          { label: 'Embalagens', href: '/catalog/inventory/packings' },
          { label: document.number },
        ]}
      />
      <PageHeader
        title={document.number}
        description={`${document.sourceNumber} · ${document.customerName}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={packingStatusLabel(document.status)} />
            {document.status === 'completed' && !hasShipment ? (
              <FeatureGate permission="shipment.create">
                <Button
                  variant="secondary"
                  disabled={busy || relatedShipments.isLoading}
                  onClick={() => void createShipmentFromPacking()}
                >
                  Criar Shipment
                </Button>
              </FeatureGate>
            ) : null}
            <Actions
              document={document}
              reason={reason}
              setReason={setReason}
              busy={busy}
              onStart={startPacking}
              onComplete={completePacking}
              onCancel={cancelPacking}
            />
          </div>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Cliente" value={document.customerName} />
        <Metric label="Pedido" value={document.sourceNumber} />
        <Metric label="Separação" value={document.pickingNumber} />
        <Metric label="Embalado" value={formatQuantity(document.totalQuantityPicked)} />
        <Metric label="Status" value={packingStatusLabel(document.status)} />
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-semibold">Itens embalados</h2>
            <EntityTable
              headers={[
                'Produto',
                'SKU',
                'Unidade',
                'Separado',
                'Status',
              ]}
            >
              {document.items.map((item) => (
                <EntityRow key={item.id}>
                  <EntityCell>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {item.description ?? 'Snapshot da separação'}
                    </div>
                  </EntityCell>
                  <EntityCell mono>{item.sku}</EntityCell>
                  <EntityCell>{item.unitCode}</EntityCell>
                  <EntityCell>{formatQuantity(item.quantityPicked)}</EntityCell>
                  <EntityCell>
                    <StatusBadge status={packingStatusLabel(item.status)} />
                  </EntityCell>
                </EntityRow>
              ))}
            </EntityTable>
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
          <h2 className="font-semibold">Resumo da embalagem</h2>
          <Info label="Cliente" value={document.customerName} />
          <Info label="Documento" value={document.customerDocument ?? '—'} />
          <Info label="Contato" value={document.customerEmail ?? document.customerPhone ?? '—'} />
          <Info label="Local padrão" value={document.locationId} />
          <Info label="Criada em" value={formatDateTime(document.createdAt)} />
          <Link
            className="text-sm text-[var(--color-primary)] hover:underline"
            to="/catalog/inventory/pickings/$pickingId"
            params={{ pickingId: document.pickingId }}
          >
            Abrir separação
          </Link>
          <Link
            className="block text-sm text-[var(--color-primary)] hover:underline"
            to="/catalog/inventory/reservations/$reservationId"
            params={{ reservationId: document.reservationId }}
          >
            Abrir reserva
          </Link>
          <Link
            className="block text-sm text-[var(--color-primary)] hover:underline"
            to="/sales/orders/$orderId"
            params={{ orderId: document.sourceId }}
          >
            Abrir pedido de venda
          </Link>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Embalagem consolida o que foi separado. Ela não altera On Hand,
            Reserved, Available, ledger, expedição, financeiro ou contas a receber.
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
  onStart,
  onComplete,
  onCancel,
}: {
  document: InventoryPackingDetail
  reason: string
  setReason: (value: string) => void
  busy: boolean
  onStart: () => Promise<void>
  onComplete: () => Promise<void>
  onCancel: () => Promise<void>
}) {
  return (
    <>
      {document.status === 'draft' ? (
        <FeatureGate permission="packing.edit">
          <Button disabled={busy} onClick={() => void onStart()}>
            Iniciar embalagem
          </Button>
        </FeatureGate>
      ) : null}
      {['draft', 'in_progress'].includes(document.status) ? (
        <FeatureGate permission="packing.cancel">
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
            Cancelar embalagem
          </Button>
        </FeatureGate>
      ) : null}
      {document.status === 'in_progress' ? (
        <FeatureGate permission="packing.complete">
          <Button disabled={busy} onClick={() => void onComplete()}>
            Concluir embalagem
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
