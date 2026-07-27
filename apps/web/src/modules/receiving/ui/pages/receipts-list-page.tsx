import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { EmptyState } from '#/components/EmptyState'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { FilterChip } from '#/components/FilterChip'
import { PageHeader } from '#/components/PageHeader'
import { SearchBar } from '#/components/SearchBar'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { formatDate } from '#/lib/format'
import { receiptStatusLabel } from '#/modules/receiving/domain/lifecycle'
import type { ReceiptStatus } from '#/modules/receiving/domain/types'
import { useReceipts } from '#/modules/receiving/ui/use-receiving-queries'
import {
  FeatureGate,
  RequirePermission,
} from '#/platform/permissions'
import { PageLoading, TableLoading, ButtonLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'

const STATUS_FILTERS: Array<{ value: ReceiptStatus | 'all'; label: string }> = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'posted', label: 'Lançados' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'archived', label: 'Arquivados' },
  { value: 'all', label: 'Todos' },
]

export function ReceiptsListPage() {
  return (
    <RequirePermission
      permission="receiving.read"
      forbiddenDescription="Você não tem permissão para ver recebimentos."
    >
      <ReceiptsListContent />
    </RequirePermission>
  )
}

function ReceiptsListContent() {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState<ReceiptStatus | 'all'>('all')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(t)
  }, [query])

  const listQuery = useReceipts({
    q: debouncedQuery || undefined,
    status,
    sort: 'created_desc',
  })

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [listQuery.data],
  )

  if (orgLoading || !currentOrganization) return <PageLoading />

  return (
    <div className="space-y-4">
      <PageHeader
        title="Recebimentos"
        description="Entrada de mercadorias a partir de pedidos aprovados."
        actions={
          <FeatureGate permission="receiving.create">
            <Button asChild><Link to="/procurement/receiving/new">Novo recebimento</Link></Button>
          </FeatureGate>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar número, pedido, fornecedor…"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => (
            <FilterChip
              key={filter.value}
              label={filter.label}
              selected={status === filter.value}
              onSelect={() => setStatus(filter.value)}
            />
          ))}
        </div>
      </div>

      {listQuery.isLoading ? (
        <TableLoading />
      ) : listQuery.isError ? (
        <EmptyState
          title="Falha ao carregar"
          description="Tente novamente em instantes."
          action={
            <Button type="button" variant="secondary" onClick={() => void listQuery.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhum recebimento"
          description="Crie o primeiro recebimento a partir de um pedido aprovado."
          action={
            <FeatureGate permission="receiving.create">
              <Button asChild><Link to="/procurement/receiving/new">Novo recebimento</Link></Button>
            </FeatureGate>
          }
        />
      ) : (
        <EntityTable headers={['Recebimento', 'Pedido', 'Fornecedor', 'Status', 'Recebido em', 'Criado']}>
          {items.map((item) => (
            <EntityRow
              key={item.id}
              onClick={() =>
                void navigate({
                  to: '/procurement/receiving/$receiptId',
                  params: { receiptId: item.id },
                })
              }
            >
              <EntityCell>
                <Link
                  to="/procurement/receiving/$receiptId"
                  params={{ receiptId: item.id }}
                  className="font-medium text-[var(--color-text)]"
                >
                  {item.number}
                </Link>
              </EntityCell>
              <EntityCell className="text-sm">{item.purchaseNumber}</EntityCell>
              <EntityCell>
                <div className="font-medium">{item.supplierLegalName}</div>
                {item.supplierDocument ? (
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {item.supplierDocument}
                  </div>
                ) : null}
              </EntityCell>
              <EntityCell>
                <StatusBadge status={receiptStatusLabel(item.status)} />
              </EntityCell>
              <EntityCell className="text-sm text-[var(--color-text-secondary)]">
                {item.receivedAt ? formatDate(item.receivedAt) : '—'}
              </EntityCell>
              <EntityCell className="text-sm text-[var(--color-text-secondary)]">
                {formatDate(item.createdAt)}
              </EntityCell>
            </EntityRow>
          ))}
        </EntityTable>
      )}

      {listQuery.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            disabled={listQuery.isFetchingNextPage}
            onClick={() => void listQuery.fetchNextPage()}
          >
            {listQuery.isFetchingNextPage ? (
              <ButtonLoading label="Carregando…" />
            ) : (
              'Carregar mais'
            )}
          </Button>
        </div>
      ) : null}

    </div>
  )
}
