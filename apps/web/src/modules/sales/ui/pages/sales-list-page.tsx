import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EmptyState } from '#/components/EmptyState'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { SearchBar } from '#/components/SearchBar'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { Select } from '#/components/ui/select'
import { formatBRL, formatDateTime } from '#/lib/format'
import {
  quotationStatusLabel,
  salesOrderStatusLabel,
  type QuotationStatus,
  type SalesDocumentType,
  type SalesListItem,
  type SalesOrderStatus,
} from '#/modules/sales'
import { PageLoading } from '#/platform/loading'
import { RequirePermission } from '#/platform/permissions'
import { useSalesDocuments } from '../use-sales'

const quotationStatuses: QuotationStatus[] = [
  'draft',
  'sent',
  'approved',
  'rejected',
  'expired',
  'archived',
]
const orderStatuses: SalesOrderStatus[] = ['draft', 'confirmed', 'cancelled', 'archived']

export function SalesListPage({ type }: { type: SalesDocumentType }) {
  return (
    <RequirePermission permission="sales.read">
      <SalesListContent type={type} />
    </RequirePermission>
  )
}

function SalesListContent({ type }: { type: SalesDocumentType }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const list = useSalesDocuments(type, {
    q: q || undefined,
    status: status || undefined,
    limit: 100,
  })
  const isQuotation = type === 'quotation'
  const title = isQuotation ? 'Orçamentos' : 'Pedidos de venda'
  const description = isQuotation
    ? 'Propostas comerciais com cliente, itens, totais e ciclo de aprovação.'
    : 'Pedidos comerciais confirmáveis sem movimentar estoque ou financeiro nesta etapa.'
  const createTo = isQuotation ? '/sales/quotations/new' : '/sales/orders/new'
  const statuses = isQuotation ? quotationStatuses : orderStatuses

  return (
    <div className="space-y-5">
      <AppBreadcrumb items={[{ label: 'Vendas', href: '/sales/orders' }, { label: title }]} />
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button asChild>
            <Link to={createTo}>{isQuotation ? 'Novo orçamento' : 'Novo pedido'}</Link>
          </Button>
        }
      />
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <SearchBar value={q} onChange={setQ} placeholder="Número, cliente ou documento…" />
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Todos os status</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {isQuotation
                ? quotationStatusLabel(item as QuotationStatus)
                : salesOrderStatusLabel(item as SalesOrderStatus)}
            </option>
          ))}
        </Select>
      </div>
      {list.isLoading ? (
        <PageLoading />
      ) : list.isError ? (
        <EmptyState title="Não foi possível carregar vendas" description={list.error.message} />
      ) : !list.data?.length ? (
        <EmptyState
          title={isQuotation ? 'Nenhum orçamento encontrado' : 'Nenhum pedido encontrado'}
          description="Crie um documento comercial para iniciar o fluxo."
          action={
            <Button asChild>
              <Link to={createTo}>{isQuotation ? 'Novo orçamento' : 'Novo pedido'}</Link>
            </Button>
          }
        />
      ) : (
        <EntityTable headers={['Número', 'Cliente', 'Documento', 'Total', 'Status', 'Criado em']}>
          {list.data.map((row) => (
            <SalesRow key={row.id} row={row} />
          ))}
        </EntityTable>
      )}
    </div>
  )
}

function SalesRow({ row }: { row: SalesListItem }) {
  const label =
    row.type === 'quotation'
      ? quotationStatusLabel(row.status as QuotationStatus)
      : salesOrderStatusLabel(row.status as SalesOrderStatus)
  return (
    <EntityRow>
      <EntityCell>
        <Link
          className="font-medium hover:underline"
          to={row.type === 'quotation' ? '/sales/quotations/$quotationId' : '/sales/orders/$orderId'}
          params={
            row.type === 'quotation'
              ? { quotationId: row.id }
              : { orderId: row.id }
          }
        >
          {row.number}
        </Link>
      </EntityCell>
      <EntityCell>{row.customerName}</EntityCell>
      <EntityCell>{row.customerDocument ?? '—'}</EntityCell>
      <EntityCell>{formatBRL(Number(row.grandTotal))}</EntityCell>
      <EntityCell>
        <StatusBadge status={label} />
      </EntityCell>
      <EntityCell>{formatDateTime(row.createdAt)}</EntityCell>
    </EntityRow>
  )
}
