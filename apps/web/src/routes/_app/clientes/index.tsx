import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { EmptyState } from '#/components/EmptyState'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { SearchBar } from '#/components/SearchBar'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '#/components/ui/dialog'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import {
  FeatureGate,
  RequirePermission,
  usePermission,
} from '#/platform/permissions'
import { PageLoading, TableLoading } from '#/platform/loading'
import {
  listCustomers,
  supabaseCustomerRepository,
} from '#/modules/customers'
import { CustomerForm } from '#/modules/customers/ui/customer-form'
import {
  toFormError,
  useCustomerActions,
} from '#/modules/customers/ui/use-customer-actions'
import { notificationService } from '#/platform/services'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app/clientes/')({
  component: CustomersListPage,
})

function CustomersListPage() {
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
  const { can } = usePermission()
  const { create } = useCustomerActions()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | 'all'>('active')
  const [createOpen, setCreateOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(t)
  }, [query])

  const organizationId = currentOrganization?.id

  const listQuery = useInfiniteQuery({
    queryKey: queryKeys.customers.list(organizationId ?? 'none', {
      q: debouncedQuery,
      status,
      sort: 'name_asc',
    }),
    enabled: Boolean(organizationId) && currentOrganization?.status === 'active',
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!organizationId) throw new Error('missing_org')
      return listCustomers({
        repository: supabaseCustomerRepository,
        can,
        organizationId,
        query: {
          q: debouncedQuery || undefined,
          status,
          cursor: pageParam,
          limit: 20,
          sort: 'name_asc',
        },
      })
    },
    getNextPageParam: (last) => last.nextCursor,
  })

  const rows = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [listQuery.data],
  )

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Cadastro comercial da organização ativa."
        actions={
          <FeatureGate permission="customers.create">
            <Button onClick={() => setCreateOpen(true)}>Novo cliente</Button>
          </FeatureGate>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar cliente…"
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['active', 'Ativos'],
              ['inactive', 'Arquivados'],
              ['all', 'Todos'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={cn(
                'rounded-[var(--radius-md)] px-3 py-1 text-xs font-medium transition',
                status === value
                  ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                  : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {listQuery.isLoading ? (
        <TableLoading rows={6} cols={4} />
      ) : listQuery.isError ? (
        <EmptyState
          icon="alert"
          title="Não foi possível carregar"
          description="Verifique a conexão e se a migration de clientes foi aplicada."
          action={
            <Button variant="secondary" onClick={() => void listQuery.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="customer"
          title={
            debouncedQuery || status !== 'active'
              ? 'Nenhum cliente encontrado'
              : 'Nenhum cliente ainda'
          }
          description={
            debouncedQuery || status !== 'active'
              ? 'Ajuste a busca ou os filtros.'
              : 'Cadastre o primeiro cliente da organização.'
          }
          action={
            debouncedQuery || status !== 'active' ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('')
                  setStatus('active')
                }}
              >
                Limpar filtros
              </Button>
            ) : (
              <FeatureGate permission="customers.create">
                <Button onClick={() => setCreateOpen(true)}>Novo cliente</Button>
              </FeatureGate>
            )
          }
        />
      ) : (
        <>
          <EntityTable headers={['Cliente', 'Documento', 'Cidade', 'Status']}>
            {rows.map((customer) => (
              <EntityRow
                key={customer.id}
                onClick={() =>
                  void navigate({
                    to: '/clientes/$customerId',
                    params: { customerId: customer.id },
                  })
                }
              >
                <EntityCell>
                  <Link
                    to="/clientes/$customerId"
                    params={{ customerId: customer.id }}
                    className="font-medium hover:text-[var(--color-accent)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {customer.name}
                  </Link>
                  {customer.tradeName ? (
                    <span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">
                      {customer.tradeName}
                    </span>
                  ) : null}
                </EntityCell>
                <EntityCell mono>{customer.document ?? '—'}</EntityCell>
                <EntityCell>{customer.city ?? '—'}</EntityCell>
                <EntityCell>
                  <StatusBadge
                    status={
                      customer.status === 'active' ? 'Ativo' : 'Arquivado'
                    }
                  />
                </EntityCell>
              </EntityRow>
            ))}
          </EntityTable>

          {listQuery.hasNextPage ? (
            <div className="mt-4 flex justify-center">
              <Button
                variant="secondary"
                disabled={listQuery.isFetchingNextPage}
                onClick={() => void listQuery.fetchNextPage()}
              >
                {listQuery.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>
            Cadastro rápido. Documento é opcional.
          </DialogDescription>
          <div className="mt-4">
            <CustomerForm
              submitting={create.isPending}
              fieldErrors={fieldErrors}
              formError={formError}
              submitLabel="Criar cliente"
              onCancel={() => setCreateOpen(false)}
              onSubmit={async (values) => {
                setFieldErrors({})
                setFormError(null)
                try {
                  const customer = await create.mutateAsync(values)
                  notificationService.success('Cliente criado')
                  setCreateOpen(false)
                  void navigate({
                    to: '/clientes/$customerId',
                    params: { customerId: customer.id },
                  })
                } catch (error) {
                  const mapped = toFormError(error)
                  setFieldErrors(mapped.fieldErrors)
                  setFormError(mapped.formError)
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
