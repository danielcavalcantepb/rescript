import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import type {
  CreatePayableInput,
  ListPayablesQuery,
  UpdatePayableInput,
} from '#/modules/payable/domain/types'
import {
  payableApprove,
  payableArchive,
  payableCancel,
  payableCreate,
  payableGetSnapshot,
  payableList,
  payableListHistory,
  payableListInstallments,
  payableRestore,
  payableSearch,
  payableUpdate,
} from '#/modules/payable/ui/payable-api'
import {
  PayableRpcClientError,
  unwrapPayableRpc,
} from '#/modules/payable/ui/errors/payable-rpc-errors'

function useOrgId() {
  const { currentOrganization } = useOrganization()
  return currentOrganization?.id
}

export function usePayables(filters: ListPayablesQuery) {
  const organizationId = useOrgId()
  return useInfiniteQuery({
    queryKey: queryKeys.payables.list(organizationId ?? 'none', {
      q: filters.q,
      status: filters.status,
      dueFrom: filters.dueFrom,
      dueTo: filters.dueTo,
      from: filters.from,
      to: filters.to,
      sort: filters.sort,
    }),
    enabled: Boolean(organizationId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPayableRpc(
        await payableList({
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

export function usePayableSearch(q: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.payables.search(organizationId ?? 'none', q),
    enabled: Boolean(organizationId) && q.trim().length >= 2,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPayableRpc(
        await payableSearch({
          data: { organizationId, query: { q, status: 'all', limit: 20 } },
        }),
      )
    },
  })
}

export function usePayable(accountsPayableId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.payables.detail(
      organizationId ?? 'none',
      accountsPayableId,
    ),
    enabled: Boolean(organizationId && accountsPayableId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPayableRpc(
        await payableGetSnapshot({
          data: { organizationId, accountsPayableId },
        }),
      )
    },
  })
}

export function usePayableInstallments(accountsPayableId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.payables.installments(
      organizationId ?? 'none',
      accountsPayableId,
    ),
    enabled: Boolean(organizationId && accountsPayableId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPayableRpc(
        await payableListInstallments({
          data: { organizationId, accountsPayableId },
        }),
      )
    },
  })
}

export function usePayableHistory(accountsPayableId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.payables.history(
      organizationId ?? 'none',
      accountsPayableId,
    ),
    enabled: Boolean(organizationId && accountsPayableId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPayableRpc(
        await payableListHistory({
          data: { organizationId, accountsPayableId },
        }),
      )
    },
  })
}

export function useCreatePayable() {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreatePayableInput) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPayableRpc(
        await payableCreate({ data: { organizationId, input } }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.payables.all(organizationId),
      })
    },
  })
}

export function useUpdatePayable(accountsPayableId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdatePayableInput) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPayableRpc(
        await payableUpdate({
          data: { organizationId, accountsPayableId, input },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.payables.all(organizationId),
      })
    },
  })
}

function usePayableLifecycleMutation(
  fn: (args: {
    data: {
      organizationId: string
      accountsPayableId: string
      reason?: string | null
    }
  }) => Promise<unknown>,
) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      args: string | { accountsPayableId: string; reason?: string | null },
    ) => {
      if (!organizationId) throw new Error('missing_org')
      const accountsPayableId =
        typeof args === 'string' ? args : args.accountsPayableId
      const reason = typeof args === 'string' ? undefined : args.reason
      return unwrapPayableRpc(
        (await fn({
          data: { organizationId, accountsPayableId, reason },
        })) as Awaited<ReturnType<typeof payableApprove>>,
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.payables.all(organizationId),
      })
    },
  })
}

export function useApprovePayable() {
  return usePayableLifecycleMutation(payableApprove)
}

export function useCancelPayable() {
  return usePayableLifecycleMutation(payableCancel)
}

export function useArchivePayable() {
  return usePayableLifecycleMutation(payableArchive)
}

export function useRestorePayable() {
  return usePayableLifecycleMutation(payableRestore)
}

export function toFormError(error: unknown): {
  formError: string | null
  fieldErrors: Record<string, string>
} {
  if (error instanceof PayableRpcClientError) {
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
