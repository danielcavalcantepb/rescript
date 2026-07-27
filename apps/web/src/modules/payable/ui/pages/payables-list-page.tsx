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
import { payableStatusLabel } from '#/modules/payable/domain/lifecycle'
import type { PayableStatus } from '#/modules/payable/domain/types'
import { usePayables } from '#/modules/payable/ui/use-payable-queries'
import {
  FeatureGate,
  RequirePermission,
} from '#/platform/permissions'
import { PageLoading, TableLoading, ButtonLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'

const STATUS_FILTERS: Array<{ value: PayableStatus | 'all'; label: string }> = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'approved', label: 'Aprovados' },
  { value: 'partially_paid', label: 'Parcialmente pagos' },
  { value: 'paid', label: 'Pagos' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'archived', label: 'Arquivados' },
  { value: 'all', label: 'Todos' },
]

function formatMoney(currency: string, amount: string): string {
  const value = Number(amount)
  if (currency === 'BRL') return formatBRL(value)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

export function PayablesListPage() {
  return (
    <RequirePermission
      permission="payable.read"
      forbiddenDescription="Você não tem permissão para ver contas a pagar."
    >
      <PayablesListContent />
    </RequirePermission>
  )
}

function PayablesListContent() {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState<PayableStatus | 'all'>('all')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(t)
  }, [query])

  const listQuery = usePayables({
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
        title="Contas a pagar"
        description="Obrigações originadas de recebimentos lançados — parcelas e ciclo de vida."
        actions={
          <FeatureGate permission="payable.create">
            <Button asChild><Link to="/finance/accounts-payable/new">Nova conta</Link></Button>
          </FeatureGate>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar número, fornecedor, GR, pedido…"
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => void listQuery.refetch()}
            >
              Tentar novamente
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nenhuma conta a pagar"
          description="Crie a partir de um recebimento lançado."
          action={
            <FeatureGate permission="payable.create">
              <Button asChild><Link to="/finance/accounts-payable/new">Nova conta</Link></Button>
            </FeatureGate>
          }
        />
      ) : (
        <EntityTable
          headers={[
            'Conta',
            'Fornecedor',
            'Original',
            'Em aberto',
            'Status',
            'Próx. venc.',
          ]}
        >
          {items.map((item) => (
            <EntityRow
              key={item.id}
              onClick={() =>
                void navigate({
                  to: '/finance/accounts-payable/$payableId',
                  params: { payableId: item.id },
                })
              }
            >
              <EntityCell>
                <Link
                  to="/finance/accounts-payable/$payableId"
                  params={{ payableId: item.id }}
                  className="font-medium text-[var(--color-text)]"
                >
                  {item.number}
                </Link>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {item.goodsReceiptNumber} · {item.purchaseNumber}
                </div>
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
                {formatMoney(item.currency, item.originalAmount)}
              </EntityCell>
              <EntityCell className="text-sm">
                {formatMoney(item.currency, item.openBalance)}
              </EntityCell>
              <EntityCell>
                <StatusBadge status={payableStatusLabel(item.status)} />
              </EntityCell>
              <EntityCell className="text-sm text-[var(--color-text-secondary)]">
                {item.nextDueDate ? formatDate(item.nextDueDate) : '—'}
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
