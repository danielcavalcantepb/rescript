import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EmptyState } from '#/components/EmptyState'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { SearchBar } from '#/components/SearchBar'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import { RequirePermission, usePermission } from '#/platform/permissions'
import { PageLoading, TableLoading } from '#/platform/loading'
import {
  listMovements,
  supabaseInventoryRepository,
  type InventoryMovementType,
} from '#/modules/inventory'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app/estoque/movimentacoes')({
  component: InventoryMovementsPage,
})

const TYPE_LABELS: Record<InventoryMovementType, string> = {
  entry: 'Entrada',
  exit: 'Saída',
  adjustment_in: 'Ajuste (+)',
  adjustment_out: 'Ajuste (−)',
}

function InventoryMovementsPage() {
  return (
    <RequirePermission
      permission="inventory.read"
      forbiddenDescription="Você não tem permissão para ver movimentações."
    >
      <InventoryMovementsContent />
    </RequirePermission>
  )
}

function InventoryMovementsContent() {
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const { can } = usePermission()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [type, setType] = useState<InventoryMovementType | 'all'>('all')
  const [productId, setProductId] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(t)
  }, [query])

  const organizationId = currentOrganization?.id

  const listQuery = useInfiniteQuery({
    queryKey: queryKeys.inventory.movementList(organizationId ?? 'none', {
      q: debouncedQuery,
      productId: productId || undefined,
      type,
    }),
    enabled: Boolean(organizationId) && currentOrganization?.status === 'active',
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!organizationId) throw new Error('missing_org')
      return listMovements({
        repository: supabaseInventoryRepository,
        can,
        organizationId,
        query: {
          q: debouncedQuery || undefined,
          productId: productId || undefined,
          type,
          cursor: pageParam,
          limit: 20,
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
      <AppBreadcrumb
        items={[
          { label: 'Estoque', href: '/estoque' },
          { label: 'Movimentações' },
        ]}
      />
      <PageHeader
        title="Movimentações"
        description="Histórico append-only do ledger de estoque."
        actions={
          <Button asChild variant="secondary">
            <Link to="/estoque">Voltar ao estoque</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Buscar motivo / notas…"
          />
          <input
            value={productId}
            onChange={(e) => setProductId(e.target.value.trim())}
            placeholder="Filtrar product id (uuid)"
            className="h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 text-[13px] sm:max-w-xs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'Todos'],
              ['entry', 'Entrada'],
              ['exit', 'Saída'],
              ['adjustment_in', 'Ajuste +'],
              ['adjustment_out', 'Ajuste −'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={cn(
                'rounded-[var(--radius-md)] px-3 py-1 text-xs font-medium transition',
                type === value
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
        <TableLoading rows={6} cols={5} />
      ) : listQuery.isError ? (
        <EmptyState
          icon="alert"
          title="Não foi possível carregar"
          description="Verifique a conexão e tente novamente."
          action={
            <Button variant="secondary" onClick={() => void listQuery.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="inventory"
          title="Nenhuma movimentação"
          description="Registre uma entrada no estoque para iniciar o histórico."
          action={
            <Button asChild>
              <Link to="/estoque">Ir para Estoque</Link>
            </Button>
          }
        />
      ) : (
        <>
          <EntityTable
            headers={['Quando', 'Tipo', 'Produto', 'Qtd', 'Motivo']}
          >
            {rows.map((m) => (
              <EntityRow key={m.id}>
                <EntityCell>
                  {new Date(m.occurredAt).toLocaleString('pt-BR')}
                </EntityCell>
                <EntityCell>
                  <StatusBadge status={TYPE_LABELS[m.type]} />
                </EntityCell>
                <EntityCell mono>
                  <Link
                    to="/produtos/$productId"
                    params={{ productId: m.productId }}
                    className="hover:text-[var(--color-accent)]"
                  >
                    {m.productId.slice(0, 8)}…
                  </Link>
                </EntityCell>
                <EntityCell mono>{formatQty(m.quantity)}</EntityCell>
                <EntityCell>{m.reason}</EntityCell>
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
    </div>
  )
}

function formatQty(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 6 })
}
