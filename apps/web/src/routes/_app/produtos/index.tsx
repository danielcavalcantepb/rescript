import { useMemo, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { EmptyState } from '#/components/EmptyState'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { PageHeader } from '#/components/PageHeader'
import { SearchBar } from '#/components/SearchBar'
import { StatusBadge } from '#/components/StatusBadge'
import { Button } from '#/components/ui/button'
import { formatBRL } from '#/lib/format'
import { products } from '#/mocks/data'

export const Route = createFileRoute('/_app/produtos/')({
  component: ProductsListPage,
})

function ProductsListPage() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const rows = useMemo(
    () =>
      products.filter((p) => {
        const q = query.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(q))
        )
      }),
    [query],
  )

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Catálogo e variantes — dados mockados."
        actions={<Button disabled>Novo produto</Button>}
      />
      <div className="mb-4">
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar produto ou SKU…" />
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon="product"
          title="Nenhum produto encontrado"
          description="Tente outro termo."
        />
      ) : (
        <EntityTable headers={['Produto', 'Categoria', 'SKU / variantes', 'Preço', 'Disponível', 'Status']}>
          {rows.map((product) => {
            const primary = product.variants[0]
            return (
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
                </EntityCell>
                <EntityCell>{product.category}</EntityCell>
                <EntityCell mono>
                  {product.variants.length === 1
                    ? primary?.sku
                    : `${product.variants.length} variantes`}
                </EntityCell>
                <EntityCell mono>
                  {primary ? formatBRL(primary.price) : '—'}
                </EntityCell>
                <EntityCell mono>
                  {primary
                    ? `${primary.available} ${primary.unit}`
                    : '—'}
                </EntityCell>
                <EntityCell>
                  <StatusBadge status={product.status} />
                </EntityCell>
              </EntityRow>
            )
          })}
        </EntityTable>
      )}
    </div>
  )
}
