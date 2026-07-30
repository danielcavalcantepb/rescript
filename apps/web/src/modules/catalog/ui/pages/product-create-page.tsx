import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { FeatureGate, RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'
import type { ProductCreationCommand } from '#/modules/catalog/application/product-creation-contract'
import { ProductWizard } from '#/modules/catalog/ui/components/product-registration/ProductWizard'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'
import { getCatalogRpcError } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { catalogErrorMessage } from '#/modules/catalog/ui/errors/catalog-rpc-errors'
import type { CatalogProductsSearch } from '#/modules/catalog/ui/filters/catalog-list-search'
import { useBrands } from '#/modules/catalog/ui/hooks/use-catalog-brands'
import { useCategories } from '#/modules/catalog/ui/hooks/use-catalog-categories'
import { useCatalogAttributes } from '#/modules/catalog/ui/hooks/use-catalog-attributes'
import { useUnits } from '#/modules/catalog/ui/hooks/use-catalog-units'
import { useCatalogPriceLists } from '#/modules/catalog/ui/hooks/use-catalog-price-lists'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { catalogCreateProductWithInitialSetup } from '#/modules/catalog/ui/catalog-api'
import { unwrapCatalogRpc } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import { listSalesBranches } from '#/modules/sales/ui/sales-api'
import { useLocations } from '#/modules/inventory/ui/hooks/use-inventory-foundation'
import { useSession } from '#/providers/app-session'

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
  const { authUser } = useSession()
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
  const priceListsQuery = useCatalogPriceLists(organizationId, Boolean(organizationId) && orgActive)
  const locationsQuery = useLocations(organizationId, Boolean(organizationId) && orgActive)
  const branchesQuery = useQuery({
    queryKey: ['catalog-product-creation-branches', organizationId],
    enabled: Boolean(organizationId) && orgActive,
    queryFn: async () => {
      const result = await listSalesBranches({ data: { organizationId: organizationId! } })
      if (!result.ok) throw new Error(result.error.code)
      return result.data
    },
  })
  const [submitting, setSubmitting] = useState(false)

  const [formError, setFormError] = useState<string | null>(null)
  const unitsError = unitsQuery.isError
    ? (() => {
        const rpc = getCatalogRpcError(unitsQuery.error)
        return rpc
          ? catalogErrorMessage(rpc)
          : 'Não foi possível carregar as unidades de medida.'
      })()
    : null

  if (orgLoading || !organizationId || !authUser) {
    return <PageLoading label="Carregando organização…" />
  }

  const scopedOrganizationId = organizationId

  async function handleSubmit(command: ProductCreationCommand, idempotencyKey: string) {
    setFormError(null)
    setSubmitting(true)
    try {
      const product = unwrapCatalogRpc(
        await catalogCreateProductWithInitialSetup({
          data: { organizationId: scopedOrganizationId, command, idempotencyKey },
        }),
      )
      notificationService.success('Produto criado')
      await navigate({
        to: '/catalog/products/$productId',
        params: { productId: product.productId },
      })
      return true
    } catch (error) {
      const rpc = getCatalogRpcError(error)
      setFormError(rpc ? catalogErrorMessage(rpc) : 'Não foi possível criar o produto.')
      return false
    } finally {
      setSubmitting(false)
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
        actorId={authUser.id}
        brands={brandsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        attributes={attributesQuery.data ?? []}
        units={unitsQuery.data ?? []}
        priceLists={priceListsQuery.data ?? []}
        branches={branchesQuery.data ?? []}
        locations={locationsQuery.data ?? []}
        unitsError={unitsError}
        submitting={submitting}
        error={formError}
        onSubmit={handleSubmit}
        onCancel={() =>
          void navigate({ to: '/catalog/products', search: listSearch })
        }
      />
    </CatalogShell>
  )
}
