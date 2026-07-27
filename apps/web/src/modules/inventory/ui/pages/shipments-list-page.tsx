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
  shipmentStatusLabel,
  type InventoryShipmentStatus,
} from '#/modules/inventory'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { RequirePermission } from '#/platform/permissions'
import { useInventoryShipments } from '../hooks/use-inventory-shipments'

const statuses: InventoryShipmentStatus[] = [
  'draft',
  'ready',
  'dispatched',
  'delivered',
  'cancelled',
]

export function ShipmentsListPage() {
  return (
    <RequirePermission
      permission="shipment.read"
      forbiddenDescription="Você não tem permissão para ver expedições."
    >
      <ShipmentsListContent />
    </RequirePermission>
  )
}

function ShipmentsListContent() {
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const shipments = useInventoryShipments(
    organizationId,
    {
      q: q || undefined,
      status: (status || undefined) as InventoryShipmentStatus | undefined,
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
          { label: 'Expedições' },
        ]}
      />
      <PageHeader
        title="Expedições"
        description="Shipment físico dos itens embalados. O estoque só é baixado no despacho."
      />
      <section className="grid gap-3 md:grid-cols-[1fr_240px]">
        <SearchBar
          value={q}
          onChange={setQ}
          placeholder="Expedição, embalagem, pedido, cliente, rastreio, produto ou SKU…"
        />
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Todos os status</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {shipmentStatusLabel(item)}
            </option>
          ))}
        </Select>
      </section>
      {shipments.isLoading ? <PageLoading /> : null}
      {shipments.isError ? (
        <PageError
          error={shipments.error}
          onRetry={() => void shipments.refetch()}
        />
      ) : null}
      {shipments.data && shipments.data.length === 0 ? (
        <EmptyState
          title="Nenhuma expedição encontrada"
          description="Expedições são criadas a partir de embalagens concluídas."
        />
      ) : null}
      {shipments.data && shipments.data.length > 0 ? (
        <EntityTable
          headers={[
            'Expedição',
            'Embalagem',
            'Pedido',
            'Cliente',
            'Rastreio',
            'Despachado',
            'Status',
            'Criada em',
          ]}
        >
          {shipments.data.map((shipment) => (
            <EntityRow key={shipment.id}>
              <EntityCell>
                <Link
                  className="font-medium hover:underline"
                  to="/catalog/inventory/shipments/$shipmentId"
                  params={{ shipmentId: shipment.id }}
                >
                  {shipment.number}
                </Link>
              </EntityCell>
              <EntityCell>
                <Link
                  className="hover:underline"
                  to="/catalog/inventory/packings/$packingId"
                  params={{ packingId: shipment.packingId }}
                >
                  {shipment.packingNumber}
                </Link>
              </EntityCell>
              <EntityCell>
                <Link
                  className="hover:underline"
                  to="/sales/orders/$orderId"
                  params={{ orderId: shipment.sourceId }}
                >
                  {shipment.sourceNumber}
                </Link>
              </EntityCell>
              <EntityCell>
                <div>{shipment.customerName}</div>
                <div className="text-xs text-[var(--color-muted)]">
                  {shipment.customerDocument ?? 'Sem documento'}
                </div>
              </EntityCell>
              <EntityCell>{shipment.trackingCode ?? '—'}</EntityCell>
              <EntityCell>{formatQuantity(shipment.totalQuantityShipped)}</EntityCell>
              <EntityCell>
                <StatusBadge status={shipmentStatusLabel(shipment.status)} />
              </EntityCell>
              <EntityCell>{formatDateTime(shipment.createdAt)}</EntityCell>
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
