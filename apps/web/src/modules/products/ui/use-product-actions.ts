import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import { usePermission } from '#/platform/permissions'
import { useSession } from '#/providers/app-session'
import {
  archiveProduct,
  createProduct,
  restoreProduct,
  updateProduct,
  supabaseProductRepository,
  ProductValidationError,
  ProductConflictError,
  productErrorMessage,
  type CreateProductInput,
  type UpdateProductInput,
} from '#/modules/products'

export function useProductActions() {
  const { currentOrganization } = useOrganization()
  const { authUser } = useSession()
  const { can } = usePermission()
  const queryClient = useQueryClient()

  const organizationId = currentOrganization?.id
  const userId = authUser?.id

  function invalidateAll() {
    if (!organizationId) return
    void queryClient.invalidateQueries({
      queryKey: queryKeys.products.all(organizationId),
    })
  }

  const create = useMutation({
    mutationFn: async (input: CreateProductInput) => {
      if (!organizationId || !userId) throw new Error('missing_context')
      return createProduct({
        repository: supabaseProductRepository,
        can,
        organizationId,
        userId,
        input,
      })
    },
    onSuccess: invalidateAll,
  })

  const update = useMutation({
    mutationFn: async ({
      productId,
      input,
    }: {
      productId: string
      input: UpdateProductInput
    }) => {
      if (!organizationId || !userId) throw new Error('missing_context')
      return updateProduct({
        repository: supabaseProductRepository,
        can,
        organizationId,
        userId,
        productId,
        input,
      })
    },
    onSuccess: invalidateAll,
  })

  const archive = useMutation({
    mutationFn: async (productId: string) => {
      if (!organizationId || !userId) throw new Error('missing_context')
      return archiveProduct({
        repository: supabaseProductRepository,
        can,
        organizationId,
        userId,
        productId,
      })
    },
    onSuccess: invalidateAll,
  })

  const restore = useMutation({
    mutationFn: async (productId: string) => {
      if (!organizationId || !userId) throw new Error('missing_context')
      return restoreProduct({
        repository: supabaseProductRepository,
        can,
        organizationId,
        userId,
        productId,
      })
    },
    onSuccess: invalidateAll,
  })

  return { create, update, archive, restore, organizationId }
}

export function toFormError(error: unknown): {
  formError: string | null
  fieldErrors: Record<string, string>
} {
  if (error instanceof ProductValidationError) {
    return { formError: null, fieldErrors: error.fieldErrors }
  }
  if (error instanceof ProductConflictError) {
    return { formError: error.message, fieldErrors: { sku: error.message } }
  }
  return {
    formError: productErrorMessage(error),
    fieldErrors: {},
  }
}
