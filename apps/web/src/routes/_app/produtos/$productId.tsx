import { useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { PageHeader } from '#/components/PageHeader'
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
  RequirePermission,
  usePermission,
} from '#/platform/permissions'
import { PageError } from '#/platform/errors'
import { PageLoading } from '#/platform/loading'
import { dialogs } from '#/platform/dialogs'
import { notificationService } from '#/platform/services'
import {
  ProductNotFoundError,
  ProductPermissionError,
  getProduct,
  supabaseProductRepository,
} from '#/modules/products'
import { ProductForm } from '#/modules/products/ui/product-form'
import {
  toFormError,
  useProductActions,
} from '#/modules/products/ui/use-product-actions'

export const Route = createFileRoute('/_app/produtos/$productId')({
  component: ProductDetailPage,
})

function ProductDetailPage() {
  return (
    <RequirePermission
      permission="products.read"
      forbiddenDescription="Você não tem permissão para ver produtos."
    >
      <ProductDetailContent />
    </RequirePermission>
  )
}

function ProductDetailContent() {
  const { productId } = Route.useParams()
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const { can } = usePermission()
  const { update, archive, restore } = useProductActions()
  const [editOpen, setEditOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const organizationId = currentOrganization?.id

  const detailQuery = useQuery({
    queryKey: queryKeys.products.detail(organizationId ?? 'none', productId),
    enabled: Boolean(organizationId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return getProduct({
        repository: supabaseProductRepository,
        can,
        organizationId,
        productId,
      })
    },
  })

  if (!organizationId || detailQuery.isLoading) {
    return <PageLoading />
  }

  if (detailQuery.isError) {
    const err = detailQuery.error
    if (
      err instanceof ProductNotFoundError ||
      err instanceof ProductPermissionError
    ) {
      return (
        <div>
          <PageHeader title="Produto não encontrado" />
          <Button asChild variant="secondary">
            <Link to="/produtos">Voltar</Link>
          </Button>
        </div>
      )
    }
    return (
      <PageError
        error={err as Error}
        onRetry={() => void detailQuery.refetch()}
        onRecover={() => void navigate({ to: '/produtos' })}
      />
    )
  }

  const product = detailQuery.data
  if (!product) {
    return (
      <div>
        <PageHeader title="Produto não encontrado" />
        <Button asChild variant="secondary">
          <Link to="/produtos">Voltar</Link>
        </Button>
      </div>
    )
  }

  const archived = product.status === 'inactive'
  const canEdit = can('products.edit') || can('products.write')

  return (
    <div>
      <AppBreadcrumb
        items={[
          { label: 'Produtos', href: '/produtos' },
          { label: product.name },
        ]}
      />
      <PageHeader
        title={product.name}
        description={`${product.sku} · ${product.unit}`}
        actions={
          <>
            <StatusBadge status={archived ? 'Arquivado' : 'Ativo'} />
            {canEdit && !archived ? (
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                Editar
              </Button>
            ) : null}
            {canEdit && !archived ? (
              <Button
                variant="danger"
                onClick={() => {
                  void dialogs
                    .confirm({
                      title: 'Arquivar produto?',
                      description:
                        'O produto sairá das listas ativas. O histórico permanece.',
                      confirmLabel: 'Arquivar',
                      tone: 'danger',
                    })
                    .then(async (result) => {
                      if (!result.confirmed) return
                      try {
                        await archive.mutateAsync(product.id)
                        notificationService.success('Produto arquivado')
                        void detailQuery.refetch()
                      } catch {
                        notificationService.error('Não foi possível arquivar')
                      }
                    })
                }}
              >
                Arquivar
              </Button>
            ) : null}
            {canEdit && archived ? (
              <Button
                onClick={() => {
                  void restore
                    .mutateAsync(product.id)
                    .then(() => {
                      notificationService.success('Produto restaurado')
                      void detailQuery.refetch()
                    })
                    .catch(() =>
                      notificationService.error('Não foi possível restaurar'),
                    )
                }}
              >
                Restaurar
              </Button>
            ) : null}
          </>
        }
      />

      {archived ? (
        <p className="mb-4 rounded-[var(--radius-md)] bg-[var(--color-warning-bg)] px-3 py-2 text-[13px] text-[var(--color-warning)]">
          Produto arquivado — somente leitura até restaurar.
        </p>
      ) : null}

      <section className="max-w-xl rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h2 className="text-sm font-medium text-[var(--color-ink-muted)] uppercase">
          Dados
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label="SKU" value={product.sku} />
          <Row label="Unidade" value={product.unit} />
          <Row label="Categoria" value={product.category ?? '—'} />
          <Row label="Descrição" value={product.description ?? '—'} />
        </dl>
      </section>

      <p className="mt-6 text-[13px] text-[var(--color-muted)]">
        Estoque, preço e variantes estarão em módulos futuros — este catálogo
        não controla inventário nem vendas.
      </p>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogTitle>Editar produto</DialogTitle>
          <DialogDescription>
            Alterações no catálogo. SKU permanece único por organização.
          </DialogDescription>
          <div className="mt-4">
            <ProductForm
              initial={{
                name: product.name,
                description: product.description,
                sku: product.sku,
                category: product.category,
                unit: product.unit,
              }}
              submitting={update.isPending}
              fieldErrors={fieldErrors}
              formError={formError}
              submitLabel="Salvar"
              onCancel={() => setEditOpen(false)}
              onSubmit={async (values) => {
                setFieldErrors({})
                setFormError(null)
                try {
                  await update.mutateAsync({
                    productId: product.id,
                    input: values,
                  })
                  notificationService.success('Produto atualizado')
                  setEditOpen(false)
                  void detailQuery.refetch()
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--color-ink-muted)]">{label}</dt>
      <dd className="mt-0.5 text-[var(--color-ink)]">{value}</dd>
    </div>
  )
}
