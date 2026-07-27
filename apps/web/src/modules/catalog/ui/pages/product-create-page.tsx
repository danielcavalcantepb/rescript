import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'
import type { CreateProductCommand } from '#/modules/catalog/application'
import { ProductWizard } from '#/modules/catalog/ui/components/product-registration/ProductWizard'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'
import { getCatalogRpcError } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogErrorMessage } from '#/modules/catalog/ui/errors/catalog-rpc-errors'
import type { CatalogProductsSearch } from '#/modules/catalog/ui/filters/catalog-list-search'
import { useBrands } from '#/modules/catalog/ui/hooks/use-catalog-brands'
import { useCategories } from '#/modules/catalog/ui/hooks/use-catalog-categories'
import { useCatalogAttributes } from '#/modules/catalog/ui/hooks/use-catalog-attributes'
import { useCreateProduct } from '#/modules/catalog/ui/hooks/use-create-catalog-product'
import { useUnits } from '#/modules/catalog/ui/hooks/use-catalog-units'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'

export function ProductCreatePage({
  listSearch,
}: {
  listSearch?: CatalogProductsSearch
}) {
  return (
    <RequirePermission
      permission="products.create"
      forbiddenDescription="Você não tem permissão para criar produtos no catálogo."
    >
      <FeatureGate permission="products.create">
        <ProductCreateContent listSearch={listSearch} />
      </FeatureGate>
    </RequirePermission>
  )
}

function ProductCreateContent({
  listSearch,
}: {
  listSearch?: CatalogProductsSearch
}) {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const orgActive = currentOrganization?.status === 'active'

  const brandsQuery = useBrands(organizationId, Boolean(organizationId) && orgActive)
  const categoriesQuery = useCategories(
    organizationId,
    Boolean(organizationId) && orgActive,
  )
  const unitsQuery = useUnits(organizationId, Boolean(organizationId) && orgActive)
  const attributesQuery = useCatalogAttributes(
    organizationId,
    Boolean(organizationId) && orgActive,
  )
  const createMutation = useCreateProduct(organizationId)

  const [formError, setFormError] = useState<string | null>(null)

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  async function handleSubmit(command: CreateProductCommand) {
    setFormError(null)
    try {
      const product = await createMutation.mutateAsync(command)
      notificationService.success('Produto criado')
      await navigate({
        to: '/catalog/products/$productId',
        params: { productId: product.id },
      })
    } catch (error) {
      const rpc = getCatalogRpcError(error)
      setFormError(rpc ? catalogErrorMessage(rpc) : 'Não foi possível criar o produto.')
    }
  }

  return (
    <CatalogShell
      title="Novo produto"
      description="Cadastre a identificação inicial. Estoque, preços e demais áreas são gerenciados no workspace."
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Produtos', href: '/catalog/products' },
        { label: 'Novo' },
      ]}
    >
      <CatalogToolbar
        title="Dados gerais"
        description="SKU, código de barras e unidade ficam na variante padrão criada pela Application Layer."
        actions={
          <Link
            to="/catalog/products"
            search={listSearch}
            className="text-[13px] text-[var(--color-accent)] hover:underline"
          >
            Voltar à lista
          </Link>
        }
      />
      <ProductWizard
        organizationId={organizationId}
        brands={brandsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        attributes={attributesQuery.data ?? []}
        units={unitsQuery.data ?? []}
        submitting={createMutation.isPending}
        error={formError}
        onSubmit={handleSubmit}
        onCancel={() =>
          void navigate({ to: '/catalog/products', search: listSearch })
        }
      />
    </CatalogShell>
  )
}
