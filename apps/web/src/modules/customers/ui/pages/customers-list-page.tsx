import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { EmptyState } from '#/components/EmptyState'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { FilterChip } from '#/components/FilterChip'
import { PageHeader } from '#/components/PageHeader'
import { SearchBar } from '#/components/SearchBar'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { customerStatusLabel } from '#/modules/customers/domain/lifecycle'
import type { CustomerStatus } from '#/modules/customers/domain/types'
import { useCustomers } from '#/modules/customers/ui/use-customer-queries'
import {
  FeatureGate,
  RequirePermission,
} from '#/platform/permissions'
import { PageLoading, TableLoading, ButtonLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'

const STATUS_FILTERS: Array<{ value: CustomerStatus | 'all'; label: string }> = [
  { value: 'active', label: 'Ativos' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'inactive', label: 'Inativos' },
  { value: 'archived', label: 'Arquivados' },
  { value: 'all', label: 'Todos' },
]

export function CustomersListPage() {
  return (
    <RequirePermission
      permission="customers.read"
      forbiddenDescription="Você não tem permissão para ver clientes."
    >
      <CustomersListContent />
    </RequirePermission>
  )
}

function CustomersListContent() {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState<CustomerStatus | 'all'>('active')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(t)
  }, [query])

  const listQuery = useCustomers({
    q: debouncedQuery || undefined,
    status,
    sort: 'name_asc',
  })

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [listQuery.data],
  )

  if (orgLoading || !currentOrganization) return <PageLoading />

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        description="Cadastro comercial — PF/PJ, contatos e endereços."
        actions={
          <FeatureGate permission="customers.create">
            <Button asChild>
              <Link to="/crm/customers/new">Novo cliente</Link>
            </Button>
          </FeatureGate>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar nome, documento, e-mail…"
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
          title="Nenhum cliente"
          description="Cadastre o primeiro cliente desta organização."
          action={
            <FeatureGate permission="customers.create">
              <Button asChild>
                <Link to="/crm/customers/new">Novo cliente</Link>
              </Button>
            </FeatureGate>
          }
        />
      ) : (
        <EntityTable headers={['Cliente', 'Celular', 'Cidade', 'Documento', 'Status']}>
          {items.map((item) => (
            <EntityRow
              key={item.id}
              onClick={() =>
                void navigate({
                  to: '/crm/customers/$customerId',
                  params: { customerId: item.id },
                })
              }
            >
              <EntityCell>
                <Link
                  to="/crm/customers/$customerId"
                  params={{ customerId: item.id }}
                  className="font-medium text-[var(--color-text)]"
                >
                  {item.legalName}
                </Link>
                {item.tradeName ? (
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {item.tradeName}
                  </div>
                ) : null}
              </EntityCell>
              <EntityCell className="text-sm text-[var(--color-text-secondary)]">
                {item.phone ?? '—'}
              </EntityCell>
              <EntityCell className="text-sm text-[var(--color-text-secondary)]">
                {item.city ?? '—'}
              </EntityCell>
              <EntityCell className="text-sm text-[var(--color-text-secondary)]">
                {item.document ?? '—'}
              </EntityCell>
              <EntityCell>
                <StatusBadge status={customerStatusLabel(item.status)} />
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
