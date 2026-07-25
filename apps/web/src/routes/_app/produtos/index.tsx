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
  listProducts,
  supabaseProductRepository,
} from '#/modules/products'
import { ProductForm } from '#/modules/products/ui/product-form'
import {
  toFormError,
  useProductActions,
} from '#/modules/products/ui/use-product-actions'
import { notificationService } from '#/platform/services'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/_app/produtos/')({
  component: ProductsListPage,
})

function ProductsListPage() {
  return (
    <RequirePermission
      permission="products.read"
      forbiddenDescription="Você não tem permissão para ver produtos."
    >
      <ProductsListContent />
    </RequirePermission>
  )
}

function ProductsListContent() {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const { can } = usePermission()
  const { create } = useProductActions()

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
    queryKey: queryKeys.products.list(organizationId ?? 'none', {
      q: debouncedQuery,
      status,
      sort: 'name_asc',
    }),
    enabled: Boolean(organizationId) && currentOrganization?.status === 'active',
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!organizationId) throw new Error('missing_org')
      return listProducts({
        repository: supabaseProductRepository,
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
        title="Produtos"
        description="Catálogo comercial da organização ativa."
        actions={
          <FeatureGate permission="products.create">
            <Button onClick={() => setCreateOpen(true)}>Novo produto</Button>
          </FeatureGate>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Buscar produto…"
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
          description="Verifique a conexão e se a migration de produtos foi aplicada."
          action={
            <Button variant="secondary" onClick={() => void listQuery.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="product"
          title={
            debouncedQuery || status !== 'active'
              ? 'Nenhum produto encontrado'
              : 'Nenhum produto ainda'
          }
          description={
            debouncedQuery || status !== 'active'
              ? 'Ajuste a busca ou os filtros.'
              : 'Cadastre o primeiro produto da organização.'
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
              <FeatureGate permission="products.create">
                <Button onClick={() => setCreateOpen(true)}>Novo produto</Button>
              </FeatureGate>
            )
          }
        />
      ) : (
        <>
          <EntityTable headers={['Produto', 'SKU', 'Unidade', 'Status']}>
            {rows.map((product) => (
              <EntityRow
                key={product.id}
                onClick={() =>
                  void navigate({
                    to: '/produtos/$productId',
                    params: { productId: product.id },
                  })
                }
              >
                <EntityCell>
                  <Link
                    to="/produtos/$productId"
                    params={{ productId: product.id }}
                    className="font-medium hover:text-[var(--color-accent)]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {product.name}
                  </Link>
                  {product.category ? (
                    <span className="mt-0.5 block text-xs text-[var(--color-ink-muted)]">
                      {product.category}
                    </span>
                  ) : null}
                </EntityCell>
                <EntityCell mono>{product.sku}</EntityCell>
                <EntityCell>{product.unit}</EntityCell>
                <EntityCell>
                  <StatusBadge
                    status={
                      product.status === 'active' ? 'Ativo' : 'Arquivado'
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
          <DialogTitle>Novo produto</DialogTitle>
          <DialogDescription>
            Catálogo da organização. SKU deve ser único.
          </DialogDescription>
          <div className="mt-4">
            <ProductForm
              submitting={create.isPending}
              fieldErrors={fieldErrors}
              formError={formError}
              submitLabel="Criar produto"
              onCancel={() => setCreateOpen(false)}
              onSubmit={async (values) => {
                setFieldErrors({})
                setFormError(null)
                try {
                  const product = await create.mutateAsync(values)
                  notificationService.success('Produto criado')
                  setCreateOpen(false)
                  void navigate({
                    to: '/produtos/$productId',
                    params: { productId: product.id },
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
