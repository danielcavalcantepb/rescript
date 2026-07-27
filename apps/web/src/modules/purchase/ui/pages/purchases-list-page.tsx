import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { EmptyState } from '#/components/EmptyState'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { FilterChip } from '#/components/FilterChip'
import { PageHeader } from '#/components/PageHeader'
import { SearchBar } from '#/components/SearchBar'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { formatBRL, formatDate } from '#/lib/format'
import { purchaseStatusLabel } from '#/modules/purchase/domain/lifecycle'
import type { PurchaseStatus } from '#/modules/purchase/domain/types'
import { usePurchases } from '#/modules/purchase/ui/use-purchase-queries'
import {
  FeatureGate,
  RequirePermission,
} from '#/platform/permissions'
import { PageLoading, TableLoading, ButtonLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'

const STATUS_FILTERS: Array<{ value: PurchaseStatus | 'all'; label: string }> = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'approved', label: 'Aprovados' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'closed', label: 'Fechados' },
  { value: 'archived', label: 'Arquivados' },
  { value: 'all', label: 'Todos' },
]

function formatTotal(currency: string, amount: string): string {
  const value = Number(amount)
  if (currency === 'BRL') return formatBRL(value)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function PurchasesListPage() {
  return (
    <RequirePermission
      permission="purchase.read"
      forbiddenDescription="Você não tem permissão para ver pedidos de compra."
    >
      <PurchasesListContent />
    </RequirePermission>
  )
}

function PurchasesListContent() {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState<PurchaseStatus | 'all'>('all')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(t)
  }, [query])

  const listQuery = usePurchases({
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
        title="Pedidos de compra"
        description="Intenção de compra — rascunho, aprovação e totais congelados."
        actions={
          <FeatureGate permission="purchase.create">
            <Button asChild><Link to="/procurement/purchases/new">Novo pedido</Link></Button>
          </FeatureGate>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar número, fornecedor, documento…"
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
          title="Nenhum pedido"
          description="Crie o primeiro pedido de compra desta organização."
          action={
            <FeatureGate permission="purchase.create">
              <Button asChild><Link to="/procurement/purchases/new">Novo pedido</Link></Button>
            </FeatureGate>
          }
        />
      ) : (
        <EntityTable headers={['Pedido', 'Fornecedor', 'Total', 'Status', 'Criado']}>
          {items.map((item) => (
            <EntityRow
              key={item.id}
              onClick={() =>
                void navigate({
                  to: '/procurement/purchases/$purchaseId',
                  params: { purchaseId: item.id },
                })
              }
            >
              <EntityCell>
                <Link
                  to="/procurement/purchases/$purchaseId"
                  params={{ purchaseId: item.id }}
                  className="font-medium text-[var(--color-text)]"
                >
                  {item.number}
                </Link>
              </EntityCell>
              <EntityCell>
                <div className="font-medium">{item.supplierLegalName}</div>
                {item.supplierDocument ? (
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {item.supplierDocument}
                  </div>
                ) : null}
              </EntityCell>
              <EntityCell className="text-sm">
                {formatTotal(item.currency, item.grandTotal)}
              </EntityCell>
              <EntityCell>
                <StatusBadge status={purchaseStatusLabel(item.status)} />
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
