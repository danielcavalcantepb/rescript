import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission, usePermission } from '#/platform/permissions'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { ProductWorkspace } from '#/modules/catalog/ui/components/product-workspace/ProductWorkspace'
import { CatalogEmptyState } from '#/modules/catalog/ui/empty-states/CatalogEmptyState'
import { getCatalogRpcError } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import type { CatalogProductsSearch } from '#/modules/catalog/ui/filters/catalog-list-search'
import { useLifecycle } from '#/modules/catalog/ui/hooks/use-catalog-lifecycle'
import { useProduct } from '#/modules/catalog/ui/hooks/use-catalog-product'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { CatalogLoadingState } from '#/modules/catalog/ui/loading/CatalogLoadingState'

export function ProductDetailsPage({
  productId,
  listSearch,
}: {
  productId: string
  listSearch?: CatalogProductsSearch
}) {
  return (
    <RequirePermission
      permission="products.read"
      forbiddenDescription="Você não tem permissão para ver produtos do catálogo."
    >
      <ProductDetailsContent productId={productId} listSearch={listSearch} />
    </RequirePermission>
  )
}

function ProductDetailsContent({
  productId,
  listSearch,
}: {
  productId: string
  listSearch?: CatalogProductsSearch
}) {
  const navigate = useNavigate()
  const { can } = usePermission()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const orgActive = currentOrganization?.status === 'active'

  const productQuery = useProduct(
    organizationId,
    productId,
    Boolean(organizationId) && orgActive,
  )
  const lifecycleQuery = useLifecycle(
    organizationId,
    productId,
    Boolean(organizationId) && orgActive,
  )

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  const rpc = getCatalogRpcError(productQuery.error)
  if (productQuery.isError && rpc?.code === 'not_found') {
    return (
      <CatalogShell
        title="Produto"
        breadcrumb={[
          { label: 'Central', href: '/' },
          { label: 'Catálogo', href: '/catalog' },
          { label: 'Produtos', href: '/catalog/products' },
          { label: 'Detalhes' },
        ]}
      >
        <CatalogEmptyState
          title="Produto não encontrado"
          description="O produto pode ter sido removido ou não está disponível nesta organização."
          action={
            <Button
              variant="secondary"
              onClick={() =>
                void navigate({ to: '/catalog/products', search: listSearch })
              }
            >
              Voltar para produtos
            </Button>
          }
        />
      </CatalogShell>
    )
  }

  if (productQuery.isError && rpc?.code === 'forbidden') {
    return (
      <CatalogShell title="Produto">
        <CatalogEmptyState
          title="Acesso não permitido"
          description="Você não tem permissão para ver este produto."
        />
      </CatalogShell>
    )
  }

  if (productQuery.isError) {
    return (
      <CatalogShell title="Produto">
        <CatalogErrorState onRetry={() => void productQuery.refetch()} />
      </CatalogShell>
    )
  }

  if (productQuery.isLoading || !productQuery.data) {
    return (
      <CatalogShell title="Produto">
        <CatalogLoadingState label="Carregando produto…" />
      </CatalogShell>
    )
  }

  const product = productQuery.data
  const canEdit = can('products.edit') || can('products.write')

  return (
    <CatalogShell
      title={product.name}
      description="Workspace central para gestão do ciclo de vida do produto."
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Produtos', href: '/catalog/products' },
        { label: product.name },
      ]}
      actions={
        <div className="flex flex-wrap gap-2">
          {product.status !== 'archived' ? (
            <FeatureGate permission="products.edit">
              <Button
                type="button"
                onClick={() =>
                  void navigate({
                    to: '/catalog/products/$productId/edit',
                    params: { productId: product.id },
                    search: listSearch,
                  })
                }
                disabled={!canEdit}
              >
                Editar
              </Button>
            </FeatureGate>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              void navigate({ to: '/catalog/products', search: listSearch })
            }
          >
            Voltar para produtos
          </Button>
        </div>
      }
    >
      <ProductWorkspace
        organizationId={organizationId}
        product={product}
        lifecycle={lifecycleQuery.data}
        lifecycleLoading={lifecycleQuery.isLoading}
        canEdit={canEdit}
      />
    </CatalogShell>
  )
}
