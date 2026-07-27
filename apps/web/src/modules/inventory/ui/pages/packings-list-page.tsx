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
  packingStatusLabel,
  type InventoryPackingStatus,
} from '#/modules/inventory'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { RequirePermission } from '#/platform/permissions'
import { useInventoryPackings } from '../hooks/use-inventory-packings'

const statuses: InventoryPackingStatus[] = [
  'draft',
  'in_progress',
  'completed',
  'cancelled',
]

export function PackingsListPage() {
  return (
    <RequirePermission
      permission="packing.read"
      forbiddenDescription="Você não tem permissão para ver embalagens."
    >
      <PackingsListContent />
    </RequirePermission>
  )
}

function PackingsListContent() {
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const packings = useInventoryPackings(
    organizationId,
    {
      q: q || undefined,
      status: (status || undefined) as InventoryPackingStatus | undefined,
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
          { label: 'Embalagens' },
        ]}
      />
      <PageHeader
        title="Embalagens"
        description="Packing físico dos itens separados. Embalagem não baixa estoque, não gera expedição e não gera financeiro."
      />
      <section className="grid gap-3 md:grid-cols-[1fr_240px]">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Embalagem, separação, reserva, pedido, cliente, produto ou SKU…"
        />
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Todos os status</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {packingStatusLabel(item)}
            </option>
          ))}
        </Select>
      </section>
      {packings.isLoading ? <PageLoading /> : null}
      {packings.isError ? (
        <PageError error={packings.error} onRetry={() => void packings.refetch()} />
      ) : null}
      {packings.data && packings.data.length === 0 ? (
        <EmptyState
          title="Nenhuma embalagem encontrada"
          description="Embalagens são criadas a partir de separações concluídas."
        />
      ) : null}
      {packings.data && packings.data.length > 0 ? (
        <EntityTable
          headers={[
            'Embalagem',
            'Separação',
            'Reserva',
            'Pedido',
            'Cliente',
            'Separado',
            'Status',
            'Criada em',
          ]}
        >
          {packings.data.map((packing) => (
            <EntityRow key={packing.id}>
              <EntityCell>
                <Link
                  className="font-medium hover:underline"
                  to="/catalog/inventory/packings/$packingId"
                  params={{ packingId: packing.id }}
                >
                  {packing.number}
                </Link>
              </EntityCell>
              <EntityCell>
                <Link
                  className="hover:underline"
                  to="/catalog/inventory/pickings/$pickingId"
                  params={{ pickingId: packing.pickingId }}
                >
                  {packing.pickingNumber}
                </Link>
              </EntityCell>
              <EntityCell>
                <Link
                  className="hover:underline"
                  to="/catalog/inventory/reservations/$reservationId"
                  params={{ reservationId: packing.reservationId }}
                >
                  {packing.reservationNumber}
                </Link>
              </EntityCell>
              <EntityCell>
                <Link
                  className="hover:underline"
                  to="/sales/orders/$orderId"
                  params={{ orderId: packing.sourceId }}
                >
                  {packing.sourceNumber}
                </Link>
              </EntityCell>
              <EntityCell>
                <div>{packing.customerName}</div>
                <div className="text-xs text-[var(--color-muted)]">
                  {packing.customerDocument ?? 'Sem documento'}
                </div>
              </EntityCell>
              <EntityCell>{formatQuantity(packing.totalQuantityPicked)}</EntityCell>
              <EntityCell>
                <StatusBadge status={packingStatusLabel(packing.status)} />
              </EntityCell>
              <EntityCell>{formatDateTime(packing.createdAt)}</EntityCell>
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
