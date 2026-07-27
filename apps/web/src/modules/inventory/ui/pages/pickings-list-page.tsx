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
  pickingStatusLabel,
  type InventoryPickingStatus,
} from '#/modules/inventory'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { RequirePermission } from '#/platform/permissions'
import { useInventoryPickings } from '../hooks/use-inventory-pickings'

const statuses: InventoryPickingStatus[] = [
  'draft',
  'in_progress',
  'partially_picked',
  'completed',
  'cancelled',
]

export function PickingsListPage() {
  return (
    <RequirePermission
      permission="picking.read"
      forbiddenDescription="Você não tem permissão para ver separações."
    >
      <PickingsListContent />
    </RequirePermission>
  )
}

function PickingsListContent() {
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const pickings = useInventoryPickings(
    organizationId,
    {
      q: q || undefined,
      status: (status || undefined) as InventoryPickingStatus | undefined,
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
          { label: 'Separações' },
        ]}
      />
      <PageHeader
        title="Separações"
        description="Picking físico dos itens reservados. Separação não baixa estoque e não gera ledger."
      />
      <section className="grid gap-3 md:grid-cols-[1fr_240px]">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Separação, reserva, pedido, cliente, produto ou SKU…"
        />
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Todos os status</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {pickingStatusLabel(item)}
            </option>
          ))}
        </Select>
      </section>
      {pickings.isLoading ? <PageLoading /> : null}
      {pickings.isError ? (
        <PageError error={pickings.error} onRetry={() => void pickings.refetch()} />
      ) : null}
      {pickings.data && pickings.data.length === 0 ? (
        <EmptyState
          title="Nenhuma separação encontrada"
          description="Separações são criadas a partir de reservas ativas de pedidos confirmados."
        />
      ) : null}
      {pickings.data && pickings.data.length > 0 ? (
        <EntityTable
          headers={[
            'Separação',
            'Reserva',
            'Pedido',
            'Cliente',
            'Reservado',
            'Separado',
            'Status',
            'Criada em',
          ]}
        >
          {pickings.data.map((picking) => (
            <EntityRow key={picking.id}>
              <EntityCell>
                <Link
                  className="font-medium hover:underline"
                  to="/catalog/inventory/pickings/$pickingId"
                  params={{ pickingId: picking.id }}
                >
                  {picking.number}
                </Link>
              </EntityCell>
              <EntityCell>
                <Link
                  className="hover:underline"
                  to="/catalog/inventory/reservations/$reservationId"
                  params={{ reservationId: picking.reservationId }}
                >
                  {picking.reservationNumber}
                </Link>
              </EntityCell>
              <EntityCell>
                <Link
                  className="hover:underline"
                  to="/sales/orders/$orderId"
                  params={{ orderId: picking.sourceId }}
                >
                  {picking.sourceNumber}
                </Link>
              </EntityCell>
              <EntityCell>
                <div>{picking.customerName}</div>
                <div className="text-xs text-[var(--color-muted)]">
                  {picking.customerDocument ?? 'Sem documento'}
                </div>
              </EntityCell>
              <EntityCell>{formatQuantity(picking.totalQuantityReserved)}</EntityCell>
              <EntityCell>{formatQuantity(picking.totalQuantityPicked)}</EntityCell>
              <EntityCell>
                <StatusBadge status={pickingStatusLabel(picking.status)} />
              </EntityCell>
              <EntityCell>{formatDateTime(picking.createdAt)}</EntityCell>
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
