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
  CreateSupplierInput,
  ListSuppliersQuery,
  UpdateAddressInput,
  UpdateContactInput,
  UpdateSupplierInput,
} from '#/modules/suppliers/domain/types'
import {
  supplierActivate,
  supplierArchive,
  supplierCreate,
  supplierCreateAddress,
  supplierCreateContact,
  supplierDeactivate,
  supplierGetSnapshot,
  supplierList,
  supplierListAddresses,
  supplierListContacts,
  supplierListHistory,
  supplierRemoveAddress,
  supplierRemoveContact,
  supplierRestore,
  supplierSearch,
  supplierUpdate,
  supplierUpdateAddress,
  supplierUpdateContact,
} from '#/modules/suppliers/ui/supplier-api'
import {
  SupplierRpcClientError,
  unwrapSupplierRpc,
} from '#/modules/suppliers/ui/errors/supplier-rpc-errors'

function useOrgId() {
  const { currentOrganization } = useOrganization()
  return currentOrganization?.id
}

export function useSuppliers(filters: ListSuppliersQuery) {
  const organizationId = useOrgId()
  return useInfiniteQuery({
    queryKey: queryKeys.suppliers.list(organizationId ?? 'none', {
      q: filters.q,
      status: filters.status,
      sort: filters.sort,
    }),
    enabled: Boolean(organizationId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapSupplierRpc(
        await supplierList({
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

export function useSupplierSearch(q: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.suppliers.search(organizationId ?? 'none', q),
    enabled: Boolean(organizationId) && q.trim().length >= 2,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapSupplierRpc(
        await supplierSearch({
          data: { organizationId, query: { q, status: 'all', limit: 20 } },
        }),
      )
    },
  })
}

export function useSupplier(supplierId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.suppliers.detail(organizationId ?? 'none', supplierId),
    enabled: Boolean(organizationId && supplierId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapSupplierRpc(
        await supplierGetSnapshot({
          data: { organizationId, supplierId },
        }),
      )
    },
  })
}

export function useSupplierContacts(supplierId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.suppliers.contacts(organizationId ?? 'none', supplierId),
    enabled: Boolean(organizationId && supplierId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapSupplierRpc(
        await supplierListContacts({
          data: { organizationId, supplierId },
        }),
      )
    },
  })
}

export function useSupplierAddresses(supplierId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.suppliers.addresses(
      organizationId ?? 'none',
      supplierId,
    ),
    enabled: Boolean(organizationId && supplierId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapSupplierRpc(
        await supplierListAddresses({
          data: { organizationId, supplierId },
        }),
      )
    },
  })
}

export function useSupplierHistory(supplierId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.suppliers.history(organizationId ?? 'none', supplierId),
    enabled: Boolean(organizationId && supplierId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapSupplierRpc(
        await supplierListHistory({
          data: { organizationId, supplierId },
        }),
      )
    },
  })
}

export function useCreateSupplier() {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateSupplierInput) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapSupplierRpc(
        await supplierCreate({ data: { organizationId, input } }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.all(organizationId),
      })
    },
  })
}

export function useUpdateSupplier(supplierId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateSupplierInput) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapSupplierRpc(
        await supplierUpdate({
          data: { organizationId, supplierId, input },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.all(organizationId),
      })
    },
  })
}

function useLifecycleMutation(
  fn: (args: {
    data: { organizationId: string; supplierId: string }
  }) => Promise<unknown>,
) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (supplierId: string) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapSupplierRpc(
        (await fn({ data: { organizationId, supplierId } })) as Awaited<
          ReturnType<typeof supplierActivate>
        >,
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.all(organizationId),
      })
    },
  })
}

export function useActivateSupplier() {
  return useLifecycleMutation(supplierActivate)
}
export function useDeactivateSupplier() {
  return useLifecycleMutation(supplierDeactivate)
}
export function useArchiveSupplier() {
  return useLifecycleMutation(supplierArchive)
}
export function useRestoreSupplier() {
  return useLifecycleMutation(supplierRestore)
}

export function useCreateContact(supplierId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<CreateContactInput, 'supplierId'>) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapSupplierRpc(
        await supplierCreateContact({
          data: { organizationId, input: { ...input, supplierId } },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.detail(organizationId, supplierId),
      })
    },
  })
}

export function useUpdateContact(supplierId: string) {
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
      return unwrapSupplierRpc(
        await supplierUpdateContact({
          data: { organizationId, contactId, input },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.detail(organizationId, supplierId),
      })
    },
  })
}

export function useRemoveContact(supplierId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contactId: string) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapSupplierRpc(
        await supplierRemoveContact({
          data: { organizationId, contactId },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.detail(organizationId, supplierId),
      })
    },
  })
}

export function useCreateAddress(supplierId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<CreateAddressInput, 'supplierId'>) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapSupplierRpc(
        await supplierCreateAddress({
          data: { organizationId, input: { ...input, supplierId } },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.detail(organizationId, supplierId),
      })
    },
  })
}

export function useUpdateAddress(supplierId: string) {
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
      return unwrapSupplierRpc(
        await supplierUpdateAddress({
          data: { organizationId, addressId, input },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.detail(organizationId, supplierId),
      })
    },
  })
}

export function useRemoveAddress(supplierId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (addressId: string) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapSupplierRpc(
        await supplierRemoveAddress({
          data: { organizationId, addressId },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.suppliers.detail(organizationId, supplierId),
      })
    },
  })
}

export function toFormError(error: unknown): {
  formError: string | null
  fieldErrors: Record<string, string>
} {
  if (error instanceof SupplierRpcClientError) {
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
