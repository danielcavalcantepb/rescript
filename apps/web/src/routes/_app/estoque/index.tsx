import { useEffect, useMemo, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
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
  listStock,
  supabaseInventoryRepository,
  type StockStatus,
} from '#/modules/inventory'
import {
  listProducts,
  supabaseProductRepository,
} from '#/modules/products'
import { MovementForm } from '#/modules/inventory/ui/movement-form'
import {
  movementFormToAdjustmentInput,
  movementFormToEntryInput,
  movementFormToExitInput,
  toMovementFormError,
  useInventoryActions,
} from '#/modules/inventory/ui/use-inventory-actions'
import { notificationService } from '#/platform/services'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app/estoque/')({
  component: InventoryStockPage,
})

function InventoryStockPage() {
  return (
    <RequirePermission
      permission="inventory.read"
      forbiddenDescription="Você não tem permissão para ver estoque."
    >
      <InventoryStockContent />
    </RequirePermission>
  )
}

type MovementDialog = null | 'entry' | 'exit' | 'adjustment'

function stockLabel(status: StockStatus): string {
  return status === 'available' ? 'Disponível' : 'Sem estoque'
}

function InventoryStockContent() {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const { can } = usePermission()
  const { entry, exit, adjustment } = useInventoryActions()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [stockStatus, setStockStatus] = useState<StockStatus | 'all'>('all')
  const [dialog, setDialog] = useState<MovementDialog>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => window.clearTimeout(t)
  }, [query])

  const organizationId = currentOrganization?.id

  const listQuery = useInfiniteQuery({
    queryKey: queryKeys.inventory.stock(organizationId ?? 'none', {
      q: debouncedQuery,
      status: 'active',
      stockStatus,
      sort: 'name_asc',
    }),
    enabled: Boolean(organizationId) && currentOrganization?.status === 'active',
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!organizationId) throw new Error('missing_org')
      return listStock({
        repository: supabaseInventoryRepository,
        can,
        organizationId,
        query: {
          q: debouncedQuery || undefined,
          status: 'active',
          stockStatus,
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

  const productsForForm = useQuery({
    queryKey: queryKeys.products.list(organizationId ?? 'none', {
      status: 'active',
      sort: 'name_asc',
    }),
    enabled: Boolean(organizationId) && dialog !== null,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return listProducts({
        repository: supabaseProductRepository,
        can,
        organizationId,
        query: { status: 'active', limit: 50, sort: 'name_asc' },
      })
    },
  })

  const productOptions = useMemo(
    () =>
      (productsForForm.data?.items ?? []).map((p) => ({
        id: p.id,
        label: `${p.name} (${p.sku})`,
      })),
    [productsForForm.data],
  )

  function openDialog(mode: MovementDialog, productId?: string) {
    setFieldErrors({})
    setFormError(null)
    setSelectedProductId(productId ?? null)
    setDialog(mode)
  }

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  const submitting =
    entry.isPending || exit.isPending || adjustment.isPending

  return (
    <div>
      <PageHeader
        title="Estoque"
        description="Saldos derivados das movimentações da organização ativa."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => void navigate({ to: '/estoque/movimentacoes' })}
            >
              Movimentações
            </Button>
            <FeatureGate permission="inventory.move">
              <Button onClick={() => openDialog('entry')}>Nova entrada</Button>
            </FeatureGate>
            <FeatureGate permission="inventory.move">
              <Button variant="secondary" onClick={() => openDialog('exit')}>
                Nova saída
              </Button>
            </FeatureGate>
            <FeatureGate permission="inventory.adjust">
              <Button
                variant="secondary"
                onClick={() => openDialog('adjustment')}
              >
                Ajuste
              </Button>
            </FeatureGate>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar produto / SKU…"
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'Todos'],
              ['available', 'Disponível'],
              ['out_of_stock', 'Sem estoque'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStockStatus(value)}
              className={cn(
                'rounded-[var(--radius-md)] px-3 py-1 text-xs font-medium transition',
                stockStatus === value
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
          description="Verifique a conexão e se a migration de estoque foi aplicada."
          action={
            <Button variant="secondary" onClick={() => void listQuery.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="inventory"
          title={
            debouncedQuery || stockStatus !== 'all'
              ? 'Nenhum item encontrado'
              : 'Nenhum produto ativo'
          }
          description={
            debouncedQuery || stockStatus !== 'all'
              ? 'Ajuste a busca ou os filtros.'
              : 'Cadastre produtos no catálogo para controlar estoque.'
          }
          action={
            debouncedQuery || stockStatus !== 'all' ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery('')
                  setStockStatus('all')
                }}
              >
                Limpar filtros
              </Button>
            ) : (
              <Button asChild variant="secondary">
                <Link to="/produtos">Ir para Produtos</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <EntityTable
            headers={['Produto', 'SKU', 'Unidade', 'Saldo', 'Status']}
          >
            {rows.map((item) => (
              <EntityRow key={item.productId}>
                <EntityCell>
                  <Link
                    to="/produtos/$productId"
                    params={{ productId: item.productId }}
                    className="font-medium hover:text-[var(--color-accent)]"
                  >
                    {item.name}
                  </Link>
                </EntityCell>
                <EntityCell mono>{item.sku}</EntityCell>
                <EntityCell>{item.unit}</EntityCell>
                <EntityCell mono>{formatQty(item.quantity)}</EntityCell>
                <EntityCell>
                  <StatusBadge status={stockLabel(item.stockStatus)} />
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

      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <DialogContent>
          <DialogTitle>
            {dialog === 'entry'
              ? 'Nova entrada'
              : dialog === 'exit'
                ? 'Nova saída'
                : 'Novo ajuste'}
          </DialogTitle>
          <DialogDescription>
            A movimentação atualiza o saldo de forma atômica. Saídas não podem
            ultrapassar o disponível.
          </DialogDescription>
          <div className="mt-4">
            {dialog ? (
              <MovementForm
                mode={dialog}
                initial={{
                  productId: selectedProductId ?? '',
                  reason:
                    dialog === 'entry'
                      ? 'Entrada manual'
                      : dialog === 'exit'
                        ? 'Saída manual'
                        : '',
                }}
                productOptions={
                  selectedProductId ? undefined : productOptions
                }
                productLabel={
                  selectedProductId
                    ? productOptions.find((p) => p.id === selectedProductId)
                        ?.label ?? 'Produto selecionado'
                    : undefined
                }
                submitting={submitting}
                fieldErrors={fieldErrors}
                formError={formError}
                onCancel={() => setDialog(null)}
                onSubmit={async (values) => {
                  setFieldErrors({})
                  setFormError(null)
                  try {
                    if (dialog === 'entry') {
                      await entry.mutateAsync(movementFormToEntryInput(values))
                      notificationService.success('Entrada registrada')
                    } else if (dialog === 'exit') {
                      await exit.mutateAsync(movementFormToExitInput(values))
                      notificationService.success('Saída registrada')
                    } else {
                      await adjustment.mutateAsync(
                        movementFormToAdjustmentInput(values),
                      )
                      notificationService.success('Ajuste registrado')
                    }
                    setDialog(null)
                  } catch (error) {
                    const mapped = toMovementFormError(error)
                    setFieldErrors(mapped.fieldErrors)
                    setFormError(mapped.formError)
                  }
                }}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatQty(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 6 })
}
