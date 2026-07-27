import { Link } from '@tanstack/react-router'
import { EntityCell, EntityRow, EntityTable } from '#/components/EntityTable'
import { Button } from '#/components/ui/button'
import type { CatalogProductListItemResponse } from '#/modules/catalog/application'
import { CatalogStatusBadge } from '#/modules/catalog/ui/components/CatalogStatusBadge'
import type { CatalogProductsSearch } from '#/modules/catalog/ui/filters/catalog-list-search'
import { icons } from '#/platform/icons/catalog'
import { FeatureGate } from '#/platform/permissions'

function formatPrice(item: CatalogProductListItemResponse): string {
  if (item.basePrice == null) return '—'
  const amount = Number(item.basePrice)
  if (!Number.isFinite(amount)) return item.basePrice
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: item.basePriceCurrency ?? 'BRL',
  })
}

export function CatalogTable({
  items,
  listSearch,
}: {
  items: CatalogProductListItemResponse[]
  listSearch?: CatalogProductsSearch
}) {
  const Eye = icons.eye

  return (
    <EntityTable
      headers={[
        'Nome',
        'SKU',
        'Marca',
        'Categoria',
        'Status',
        'Preço base',
        'Variantes',
        'Última atualização',
        'Ações',
      ]}
    >
      {items.map((item) => (
        <EntityRow key={item.id}>
          <EntityCell>
            <Link
              to="/catalog/products/$productId"
              params={{ productId: item.id }}
              search={listSearch}
              className="font-medium text-[var(--color-ink)] hover:text-[var(--color-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
            >
              {item.name}
            </Link>
          </EntityCell>
          <EntityCell mono>{item.sku ?? '—'}</EntityCell>
          <EntityCell>{item.brandName ?? '—'}</EntityCell>
          <EntityCell>{item.categoryName ?? '—'}</EntityCell>
          <EntityCell>
            <CatalogStatusBadge status={item.status} />
          </EntityCell>
          <EntityCell mono>{formatPrice(item)}</EntityCell>
          <EntityCell mono>{item.variantCount}</EntityCell>
          <EntityCell>
            {item.updatedAt
              ? new Date(item.updatedAt).toLocaleString('pt-BR')
              : '—'}
          </EntityCell>
          <EntityCell>
            <div className="flex flex-wrap gap-1">
              <Button type="button" variant="ghost" size="sm" asChild>
                <Link
                  to="/catalog/products/$productId"
                  params={{ productId: item.id }}
                  search={listSearch}
                  aria-label={`Visualizar ${item.name}`}
                >
                  <Eye className="size-3.5" strokeWidth={1.5} aria-hidden />
                  Ver
                </Link>
              </Button>
              <FeatureGate permission="products.edit">
                <Button type="button" variant="ghost" size="sm" asChild>
                  <Link
                    to="/catalog/products/$productId/edit"
                    params={{ productId: item.id }}
                    search={listSearch}
                    aria-label={`Editar ${item.name}`}
                  >
                    Editar
                  </Link>
                </Button>
              </FeatureGate>
            </div>
          </EntityCell>
        </EntityRow>
      ))}
    </EntityTable>
  )
}
