import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { PageLoading } from '#/platform/loading'
import { useOrganization } from '#/platform/organization/organization-context'
import { RequirePermission } from '#/platform/permissions'
import { notificationService } from '#/platform/services'
import { ProductForm } from '#/modules/catalog/ui/components/product-form/ProductForm'
import {
  detailToFormValues,
  formToUpdateCommand,
} from '#/modules/catalog/ui/components/product-form/mappers'
import { CatalogErrorState } from '#/modules/catalog/ui/components/CatalogErrorState'
import { CatalogToolbar } from '#/modules/catalog/ui/components/CatalogToolbar'
import { CatalogEmptyState } from '#/modules/catalog/ui/empty-states/CatalogEmptyState'
import { catalogErrorMessage } from '#/modules/catalog/ui/errors/catalog-rpc-errors'
import { getCatalogRpcError } from '#/modules/catalog/ui/errors/unwrap-catalog-rpc'
import type { CatalogProductsSearch } from '#/modules/catalog/ui/filters/catalog-list-search'
import { useBrands } from '#/modules/catalog/ui/hooks/use-catalog-brands'
import { useCategories } from '#/modules/catalog/ui/hooks/use-catalog-categories'
import { useProduct } from '#/modules/catalog/ui/hooks/use-catalog-product'
import { useUnits } from '#/modules/catalog/ui/hooks/use-catalog-units'
import { useUpdateProduct } from '#/modules/catalog/ui/hooks/use-update-catalog-product'
import { CatalogShell } from '#/modules/catalog/ui/layouts/CatalogShell'
import { CatalogLoadingState } from '#/modules/catalog/ui/loading/CatalogLoadingState'
import type { ProductFormValues } from '#/modules/catalog/ui/validation/product-form-schema'

export function ProductEditPage({
  productId,
  listSearch,
}: {
  productId: string
  listSearch?: CatalogProductsSearch
}) {
  return (
    <RequirePermission
      permission="products.edit"
      forbiddenDescription="Você não tem permissão para editar produtos do catálogo."
    >
      <ProductEditContent productId={productId} listSearch={listSearch} />
    </RequirePermission>
  )
}

function ProductEditContent({
  productId,
  listSearch,
}: {
  productId: string
  listSearch?: CatalogProductsSearch
}) {
  const navigate = useNavigate()
  const { currentOrganization, isLoading: orgLoading } = useOrganization()
  const organizationId = currentOrganization?.id
  const orgActive = currentOrganization?.status === 'active'

  const productQuery = useProduct(
    organizationId,
    productId,
    Boolean(organizationId) && orgActive,
  )
  const brandsQuery = useBrands(organizationId, Boolean(organizationId) && orgActive)
  const categoriesQuery = useCategories(
    organizationId,
    Boolean(organizationId) && orgActive,
  )
  const unitsQuery = useUnits(organizationId, Boolean(organizationId) && orgActive)
  const updateMutation = useUpdateProduct(organizationId)

  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const initial = useMemo(
    () =>
      productQuery.data ? detailToFormValues(productQuery.data) : undefined,
    [productQuery.data],
  )

  if (orgLoading || !organizationId) {
    return <PageLoading label="Carregando organização…" />
  }

  const rpc = getCatalogRpcError(productQuery.error)
  if (productQuery.isError && rpc?.code === 'not_found') {
    return (
      <CatalogShell title="Editar produto">
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

  if (productQuery.isError) {
    return (
      <CatalogShell title="Editar produto">
        <CatalogErrorState onRetry={() => void productQuery.refetch()} />
      </CatalogShell>
    )
  }

  if (productQuery.isLoading || !initial) {
    return (
      <CatalogShell title="Editar produto">
        <CatalogLoadingState label="Carregando produto…" />
      </CatalogShell>
    )
  }

  async function handleSubmit(values: ProductFormValues) {
    setFormError(null)
    setFieldErrors({})
    try {
      await updateMutation.mutateAsync(
        formToUpdateCommand(productId, {
          name: values.name,
          brandId: values.brandId || null,
          primaryCategoryId: values.primaryCategoryId || null,
          description: values.description || null,
        }),
      )
      notificationService.success('Produto atualizado')
      await navigate({
        to: '/catalog/products/$productId',
        params: { productId },
        search: listSearch,
      })
    } catch (error) {
      const err = getCatalogRpcError(error)
      if (err?.fieldErrors) setFieldErrors(err.fieldErrors)
      setFormError(
        err ? catalogErrorMessage(err) : 'Não foi possível atualizar o produto.',
      )
    }
  }

  return (
    <CatalogShell
      title="Editar produto"
      description="Atualiza nome, marca, categoria e descrição. SKU e unidade não são alteráveis aqui."
      breadcrumb={[
        { label: 'Central', href: '/' },
        { label: 'Catálogo', href: '/catalog' },
        { label: 'Produtos', href: '/catalog/products' },
        { label: initial.name, href: `/catalog/products/${productId}` },
        { label: 'Editar' },
      ]}
    >
      <CatalogToolbar title={initial.name} />
      <ProductForm
        mode="edit"
        initial={initial}
        brands={brandsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        units={unitsQuery.data ?? []}
        submitting={updateMutation.isPending}
        formError={formError}
        serverFieldErrors={fieldErrors}
        submitLabel="Salvar alterações"
        onSubmit={handleSubmit}
        onCancel={() =>
          void navigate({
            to: '/catalog/products/$productId',
            params: { productId },
            search: listSearch,
          })
        }
      />
    </CatalogShell>
  )
}
