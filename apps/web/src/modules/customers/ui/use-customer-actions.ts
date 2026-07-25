import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import { usePermission } from '#/platform/permissions'
import { useSession } from '#/providers/app-session'
import {
  archiveCustomer,
  createCustomer,
  restoreCustomer,
  updateCustomer,
  supabaseCustomerRepository,
  CustomerValidationError,
  CustomerConflictError,
  customerErrorMessage,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from '#/modules/customers'

export function useCustomerActions() {
  const { currentOrganization } = useOrganization()
  const { authUser } = useSession()
  const { can } = usePermission()
  const queryClient = useQueryClient()

  const organizationId = currentOrganization?.id
  const userId = authUser?.id

  function invalidateAll() {
    if (!organizationId) return
    void queryClient.invalidateQueries({
      queryKey: queryKeys.customers.all(organizationId),
    })
  }

  const create = useMutation({
    mutationFn: async (input: CreateCustomerInput) => {
      if (!organizationId || !userId) throw new Error('missing_context')
      return createCustomer({
        repository: supabaseCustomerRepository,
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
      customerId,
      input,
    }: {
      customerId: string
      input: UpdateCustomerInput
    }) => {
      if (!organizationId || !userId) throw new Error('missing_context')
      return updateCustomer({
        repository: supabaseCustomerRepository,
        can,
        organizationId,
        userId,
        customerId,
        input,
      })
    },
    onSuccess: invalidateAll,
  })

  const archive = useMutation({
    mutationFn: async (customerId: string) => {
      if (!organizationId || !userId) throw new Error('missing_context')
      return archiveCustomer({
        repository: supabaseCustomerRepository,
        can,
        organizationId,
        userId,
        customerId,
      })
    },
    onSuccess: invalidateAll,
  })

  const restore = useMutation({
    mutationFn: async (customerId: string) => {
      if (!organizationId || !userId) throw new Error('missing_context')
      return restoreCustomer({
        repository: supabaseCustomerRepository,
        can,
        organizationId,
        userId,
        customerId,
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
  if (error instanceof CustomerValidationError) {
    return { formError: null, fieldErrors: error.fieldErrors }
  }
  if (error instanceof CustomerConflictError) {
    return { formError: error.message, fieldErrors: { document: error.message } }
  }
  return {
    formError: customerErrorMessage(error),
    fieldErrors: {},
  }
}
