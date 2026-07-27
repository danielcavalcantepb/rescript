import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EmptyState } from '#/components/EmptyState'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { SearchBar } from '#/components/SearchBar'
import { StatusBadge } from '#/components/StatusBadge'
import { Select } from '#/components/ui/select'
import { formatDateTime } from '#/lib/format'
import {
  reservationStatusLabel,
  type InventoryReservationStatus,
} from '#/modules/inventory'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { RequirePermission } from '#/platform/permissions'
import { useInventoryReservations } from '../hooks/use-inventory-reservations'

const statuses: InventoryReservationStatus[] = [
  'draft',
  'active',
  'partially_released',
  'released',
  'cancelled',
]

export function ReservationsListPage() {
  return (
    <RequirePermission
      permission="reservation.read"
      forbiddenDescription="Você não tem permissão para ver reservas."
    >
      <ReservationsListContent />
    </RequirePermission>
  )
}

function ReservationsListContent() {
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const reservations = useInventoryReservations(
    organizationId,
    {
      q: q || undefined,
      status: (status || undefined) as InventoryReservationStatus | undefined,
      limit: 100,
    },
    currentOrganization?.status === 'active',
  )

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  return (
    <div className="space-y-5">
      <AppBreadcrumb
        items={[
          { label: 'Central', href: '/' },
          { label: 'Estoque', href: '/catalog/inventory/items' },
          { label: 'Reservas' },
        ]}
      />
      <PageHeader
        title="Reservas de estoque"
        description="Compromissos de saldo originados por pedidos de venda confirmados. Reserva não baixa estoque."
      />
      <section className="grid gap-3 md:grid-cols-[1fr_240px]">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Reserva, pedido, cliente, produto ou SKU…"
        />
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Todos os status</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {reservationStatusLabel(item)}
            </option>
          ))}
        </Select>
      </section>
      {reservations.isLoading ? <PageLoading /> : null}
      {reservations.isError ? (
        <PageError
          error={reservations.error}
          onRetry={() => void reservations.refetch()}
        />
      ) : null}
      {reservations.data && reservations.data.length === 0 ? (
        <EmptyState
          title="Nenhuma reserva encontrada"
          description="Reservas nascem a partir de pedidos de venda confirmados com saldo disponível."
        />
      ) : null}
      {reservations.data && reservations.data.length > 0 ? (
        <EntityTable
          headers={[
            'Reserva',
            'Pedido',
            'Cliente',
            'Reservado',
            'Liberado',
            'Status',
            'Criada em',
          ]}
        >
          {reservations.data.map((reservation) => (
            <EntityRow key={reservation.id}>
              <EntityCell>
                <Link
                  className="font-medium hover:underline"
                  to="/catalog/inventory/reservations/$reservationId"
                  params={{ reservationId: reservation.id }}
                >
                  {reservation.number}
                </Link>
              </EntityCell>
              <EntityCell>
                <Link
                  className="hover:underline"
                  to="/sales/orders/$orderId"
                  params={{ orderId: reservation.sourceId }}
                >
                  {reservation.sourceNumber}
                </Link>
              </EntityCell>
              <EntityCell>
                <div>{reservation.customerName}</div>
                <div className="text-xs text-[var(--color-muted)]">
                  {reservation.customerDocument ?? 'Sem documento'}
                </div>
              </EntityCell>
              <EntityCell>{formatQuantity(reservation.totalQuantityReserved)}</EntityCell>
              <EntityCell>{formatQuantity(reservation.totalQuantityReleased)}</EntityCell>
              <EntityCell>
                <StatusBadge status={reservationStatusLabel(reservation.status)} />
              </EntityCell>
              <EntityCell>{formatDateTime(reservation.createdAt)}</EntityCell>
            </EntityRow>
          ))}
        </EntityTable>
      ) : null}
    </div>
  )
}

function formatQuantity(value: string) {
  return Number(value).toLocaleString('pt-BR', {
    maximumFractionDigits: 6,
  })
}
