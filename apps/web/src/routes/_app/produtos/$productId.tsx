import { Link, createFileRoute } from '@tanstack/react-router'
import { AppBreadcrumb } from '#/components/AppBreadcrumb'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { formatBRL } from '#/lib/format'
import { getProduct } from '#/mocks/data'

export const Route = createFileRoute('/_app/produtos/$productId')({
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { productId } = Route.useParams()
  const product = getProduct(productId)

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

  const simple = product.variants.length === 1 && product.variants[0]?.label === 'Padrão'

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
        description={`${product.category} · ${product.tracksInventory ? 'Controla estoque' : 'Sem estoque'}`}
        actions={<StatusBadge status={product.status} />}
      />

      {simple ? (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h2 className="text-sm font-medium text-[var(--color-ink-muted)] uppercase">
            Dados
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-[var(--color-ink-muted)]">SKU</dt>
              <dd className="mt-0.5 font-mono">{product.variants[0]?.sku}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-muted)]">Preço</dt>
              <dd className="mt-0.5 font-mono">
                {formatBRL(product.variants[0]?.price ?? 0)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-muted)]">Disponível</dt>
              <dd className="mt-0.5 font-mono">
                {product.variants[0]?.available} {product.variants[0]?.unit}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-ink-muted)]">Físico / Reservado</dt>
              <dd className="mt-0.5 font-mono text-[var(--color-ink-muted)]">
                {product.variants[0]?.physical} / {product.variants[0]?.reserved}
              </dd>
            </div>
          </dl>
        </section>
      ) : (
        <EntityTable headers={['Variante', 'SKU', 'Preço', 'Disponível', 'Físico', 'Reservado']}>
          {product.variants.map((variant) => (
            <EntityRow key={variant.id}>
              <EntityCell>{variant.label}</EntityCell>
              <EntityCell mono>{variant.sku}</EntityCell>
              <EntityCell mono>{formatBRL(variant.price)}</EntityCell>
              <EntityCell mono>
                {variant.available} {variant.unit}
              </EntityCell>
              <EntityCell mono>{variant.physical}</EntityCell>
              <EntityCell mono>{variant.reserved}</EntityCell>
            </EntityRow>
          ))}
        </EntityTable>
      )}
    </div>
  )
}
