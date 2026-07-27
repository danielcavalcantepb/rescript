import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { formatDateTime } from '#/lib/format'
import {
  reservationOpenQuantity,
  reservationStatusLabel,
  type InventoryReservationDetail,
} from '#/modules/inventory'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission } from '#/platform/permissions'
import {
  useActivateInventoryReservation,
  useCancelInventoryReservation,
  useInventoryReservation,
  useReleaseInventoryReservation,
} from '../hooks/use-inventory-reservations'
import {
  useCreateInventoryPicking,
  useInventoryPickings,
} from '../hooks/use-inventory-pickings'

export function ReservationDetailPage({
  reservationId,
}: {
  reservationId: string
}) {
  return (
    <RequirePermission
      permission="reservation.read"
      forbiddenDescription="Você não tem permissão para ver esta reserva."
    >
      <ReservationDetailContent reservationId={reservationId} />
    </RequirePermission>
  )
}

function ReservationDetailContent({
  reservationId,
}: {
  reservationId: string
}) {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const reservation = useInventoryReservation(organizationId, reservationId)
  const relatedPickings = useInventoryPickings(
    organizationId,
    {
      q: reservation.data?.number,
      limit: 10,
    },
    Boolean(organizationId && reservation.data?.number),
  )
  const activate = useActivateInventoryReservation(organizationId)
  const release = useReleaseInventoryReservation(organizationId)
  const cancel = useCancelInventoryReservation(organizationId)
  const createPicking = useCreateInventoryPicking(organizationId)
  const [reason, setReason] = useState('')

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }
  if (reservation.isLoading) return <PageLoading />
  if (reservation.isError || !reservation.data) {
    return (
      <PageError
        error={reservation.error ?? new Error('reservation_not_found')}
        onRetry={() => void reservation.refetch()}
      />
    )
  }

  const document = reservation.data
  const hasActivePicking = relatedPickings.data?.some(
    (picking) =>
      picking.reservationId === document.id && picking.status !== 'cancelled',
  )
  const busy =
    activate.isPending ||
    release.isPending ||
    cancel.isPending ||
    createPicking.isPending

  async function activateReservation() {
    await activate.mutateAsync(document.id)
    await reservation.refetch()
  }

  async function releaseReservation() {
    await release.mutateAsync({
      reservationId: document.id,
      items: null,
      reason: reason || null,
    })
    setReason('')
    await reservation.refetch()
  }

  async function cancelReservation() {
    await cancel.mutateAsync({
      reservationId: document.id,
      reason: reason || null,
    })
    setReason('')
    await reservation.refetch()
  }

  async function createPickingFromReservation() {
    const pickingId = await createPicking.mutateAsync({
      reservationId: document.id,
    })
    await navigate({
      to: '/catalog/inventory/pickings/$pickingId',
      params: { pickingId },
    })
  }

  return (
    <div className="space-y-6">
      <AppBreadcrumb
        items={[
          { label: 'Central', href: '/' },
          { label: 'Estoque', href: '/catalog/inventory/items' },
          { label: 'Reservas', href: '/catalog/inventory/reservations' },
          { label: document.number },
        ]}
      />
      <PageHeader
        title={document.number}
        description={`${document.sourceNumber} · ${document.customerName}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={reservationStatusLabel(document.status)} />
            {document.status === 'active' &&
            !relatedPickings.isLoading &&
            !hasActivePicking ? (
              <FeatureGate permission="picking.create">
                <Button
                  disabled={busy}
                  onClick={() => void createPickingFromReservation()}
                >
                  Criar Picking
                </Button>
              </FeatureGate>
            ) : null}
            <Actions
              document={document}
              reason={reason}
              setReason={setReason}
              busy={busy}
              onActivate={activateReservation}
              onRelease={releaseReservation}
              onCancel={cancelReservation}
            />
          </div>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Cliente" value={document.customerName} />
        <Metric label="Pedido" value={document.sourceNumber} />
        <Metric label="Reservado" value={formatQuantity(document.totalQuantityReserved)} />
        <Metric label="Liberado" value={formatQuantity(document.totalQuantityReleased)} />
        <Metric label="Status" value={reservationStatusLabel(document.status)} />
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-semibold">Itens reservados</h2>
            <EntityTable
              headers={[
                'Produto',
                'SKU',
                'Unidade',
                'Reservado',
                'Liberado',
                'Disponível na reserva',
                'Status',
              ]}
            >
              {document.items.map((item) => (
                <EntityRow key={item.id}>
                  <EntityCell>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-xs text-[var(--color-muted)]">
                      {item.description ?? 'Snapshot do pedido'}
                    </div>
                  </EntityCell>
                  <EntityCell mono>{item.sku}</EntityCell>
                  <EntityCell>{item.unitCode}</EntityCell>
                  <EntityCell>{formatQuantity(item.quantityReserved)}</EntityCell>
                  <EntityCell>{formatQuantity(item.quantityReleased)}</EntityCell>
                  <EntityCell>
                    {formatQuantity(
                      String(
                        reservationOpenQuantity(
                          item.quantityReserved,
                          item.quantityReleased,
                        ),
                      ),
                    )}
                  </EntityCell>
                  <EntityCell>
                    <StatusBadge status={reservationStatusLabel(item.status)} />
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
          <h2 className="font-semibold">Resumo da reserva</h2>
          <Info label="Cliente" value={document.customerName} />
          <Info label="Documento" value={document.customerDocument ?? '—'} />
          <Info label="Contato" value={document.customerEmail ?? document.customerPhone ?? '—'} />
          <Info label="Local padrão" value={document.locationId} />
          <Info label="Criada em" value={formatDateTime(document.createdAt)} />
          <Link
            className="text-sm text-[var(--color-primary)] hover:underline"
            to="/sales/orders/$orderId"
            params={{ orderId: document.sourceId }}
          >
            Abrir pedido de venda
          </Link>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Reserva reduz o disponível para novas reservas, mas não altera o
            saldo físico e não cria movimentação no ledger.
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
  onActivate,
  onRelease,
  onCancel,
}: {
  document: InventoryReservationDetail
  reason: string
  setReason: (value: string) => void
  busy: boolean
  onActivate: () => Promise<void>
  onRelease: () => Promise<void>
  onCancel: () => Promise<void>
}) {
  return (
    <>
      {document.status === 'draft' ? (
        <FeatureGate permission="reservation.activate">
          <Button disabled={busy} onClick={() => void onActivate()}>
            Ativar
          </Button>
        </FeatureGate>
      ) : null}
      {['active', 'partially_released'].includes(document.status) ? (
        <>
          <FeatureGate permission="reservation.release">
            <Input
              className="w-48"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Motivo"
            />
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => void onRelease()}
            >
              Liberar saldo
            </Button>
          </FeatureGate>
          <FeatureGate permission="reservation.cancel">
            <Button
              variant="secondary"
              disabled={busy || !reason.trim()}
              onClick={() => void onCancel()}
            >
              Cancelar reserva
            </Button>
          </FeatureGate>
        </>
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
