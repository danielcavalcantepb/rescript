import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import type {
  CreateAddressInput,
  CreateContactInput,
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateAddressInput,
  UpdateContactInput,
  UpdateCustomerInput,
} from '#/modules/customers/domain/types'
import {
  customerActivate,
  customerArchive,
  customerCreate,
  customerCreateAddress,
  customerCreateContact,
  customerDeactivate,
  customerGetSnapshot,
  customerList,
  customerListAddresses,
  customerListContacts,
  customerListHistory,
  customerRemoveAddress,
  customerRemoveContact,
  customerRestore,
  customerSearch,
  customerUpdate,
  customerUpdateAddress,
  customerUpdateContact,
} from '#/modules/customers/ui/customer-api'
import {
  CustomerRpcClientError,
  unwrapCustomerRpc,
} from '#/modules/customers/ui/errors/customer-rpc-errors'

function useOrgId() {
  const { currentOrganization } = useOrganization()
  return currentOrganization?.id
}

export function useCustomers(
  filters: ListCustomersQuery,
  options?: { enabled?: boolean },
) {
  const organizationId = useOrgId()
  return useInfiniteQuery({
    queryKey: queryKeys.customers.list(organizationId ?? 'none', {
      q: filters.q,
      status: filters.status,
      sort: filters.sort,
    }),
    enabled: Boolean(organizationId) && options?.enabled !== false,
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerList({
          data: {
            organizationId,
            query: { ...filters, cursor: pageParam },
          },
        }),
      )
    },
    getNextPageParam: (last) => last.nextCursor,
  })
}

export function useCustomerSearch(q: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.customers.search(organizationId ?? 'none', q),
    enabled: Boolean(organizationId) && q.trim().length >= 2,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerSearch({
          data: { organizationId, query: { q, status: 'all', limit: 20 } },
        }),
      )
    },
  })
}

export function useCustomer(customerId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.customers.detail(organizationId ?? 'none', customerId),
    enabled: Boolean(organizationId && customerId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerGetSnapshot({
          data: { organizationId, customerId },
        }),
      )
    },
  })
}

export function useCustomerContacts(customerId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.customers.contacts(organizationId ?? 'none', customerId),
    enabled: Boolean(organizationId && customerId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerListContacts({
          data: { organizationId, customerId },
        }),
      )
    },
  })
}

export function useCustomerAddresses(customerId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.customers.addresses(
      organizationId ?? 'none',
      customerId,
    ),
    enabled: Boolean(organizationId && customerId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerListAddresses({
          data: { organizationId, customerId },
        }),
      )
    },
  })
}

export function useCustomerHistory(customerId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.customers.history(organizationId ?? 'none', customerId),
    enabled: Boolean(organizationId && customerId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerListHistory({
          data: { organizationId, customerId },
        }),
      )
    },
  })
}

export function useCreateCustomer() {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCustomerInput) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerCreate({ data: { organizationId, input } }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.all(organizationId),
      })
    },
  })
}

export function useUpdateCustomer(customerId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateCustomerInput) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerUpdate({
          data: { organizationId, customerId, input },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.all(organizationId),
      })
    },
  })
}

function useLifecycleMutation(
  fn: (args: {
    data: { organizationId: string; customerId: string }
  }) => Promise<unknown>,
) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (customerId: string) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        (await fn({ data: { organizationId, customerId } })) as Awaited<
          ReturnType<typeof customerActivate>
        >,
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.all(organizationId),
      })
    },
  })
}

export function useActivateCustomer() {
  return useLifecycleMutation(customerActivate)
}
export function useDeactivateCustomer() {
  return useLifecycleMutation(customerDeactivate)
}
export function useArchiveCustomer() {
  return useLifecycleMutation(customerArchive)
}
export function useRestoreCustomer() {
  return useLifecycleMutation(customerRestore)
}

export function useCreateContact(customerId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<CreateContactInput, 'customerId'>) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerCreateContact({
          data: { organizationId, input: { ...input, customerId } },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(organizationId, customerId),
      })
    },
  })
}

export function useUpdateContact(customerId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      contactId,
      input,
    }: {
      contactId: string
      input: UpdateContactInput
    }) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerUpdateContact({
          data: { organizationId, contactId, input },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(organizationId, customerId),
      })
    },
  })
}

export function useRemoveContact(customerId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contactId: string) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerRemoveContact({
          data: { organizationId, contactId },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(organizationId, customerId),
      })
    },
  })
}

export function useCreateAddress(customerId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<CreateAddressInput, 'customerId'>) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerCreateAddress({
          data: { organizationId, input: { ...input, customerId } },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(organizationId, customerId),
      })
    },
  })
}

/** Reuses the canonical address command after a customer is created in the same UI flow. */
export function useCreateCustomerAddress() {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ customerId, ...input }: CreateAddressInput) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerCreateAddress({ data: { organizationId, input: { customerId, ...input } } }),
      )
    },
    onSuccess: (_, variables) => {
      if (!organizationId) return
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(organizationId, variables.customerId) })
    },
  })
}

export function useUpdateAddress(customerId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      addressId,
      input,
    }: {
      addressId: string
      input: UpdateAddressInput
    }) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerUpdateAddress({
          data: { organizationId, addressId, input },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(organizationId, customerId),
      })
    },
  })
}

export function useRemoveAddress(customerId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (addressId: string) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapCustomerRpc(
        await customerRemoveAddress({
          data: { organizationId, addressId },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(organizationId, customerId),
      })
    },
  })
}

export function toFormError(error: unknown): {
  formError: string | null
  fieldErrors: Record<string, string>
} {
  if (error instanceof CustomerRpcClientError) {
    return {
      formError: error.fieldErrors ? null : error.message,
      fieldErrors: error.fieldErrors ?? {},
    }
  }
  return {
    formError: 'Não foi possível concluir a operação. Tente novamente.',
    fieldErrors: {},
  }
}
