import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import type {
  AddPurchaseItemInput,
  CreatePurchaseInput,
  ListPurchasesQuery,
  UpdatePurchaseInput,
  UpdatePurchaseItemInput,
} from '#/modules/purchase/domain/types'
import {
  purchaseAddItem,
  purchaseApprove,
  purchaseArchive,
  purchaseCancel,
  purchaseClose,
  purchaseConfirm,
  purchaseCreate,
  purchaseGetSnapshot,
  purchaseList,
  purchaseListHistory,
  purchaseListItems,
  purchaseRemoveItem,
  purchaseRestore,
  purchaseSend,
  purchaseSearch,
  purchaseUpdate,
  purchaseUpdateItem,
} from '#/modules/purchase/ui/purchase-api'
import {
  PurchaseRpcClientError,
  unwrapPurchaseRpc,
} from '#/modules/purchase/ui/errors/purchase-rpc-errors'

function useOrgId() {
  const { currentOrganization } = useOrganization()
  return currentOrganization?.id
}

export function usePurchases(filters: ListPurchasesQuery) {
  const organizationId = useOrgId()
  return useInfiniteQuery({
    queryKey: queryKeys.purchases.list(organizationId ?? 'none', {
      q: filters.q,
      status: filters.status,
      from: filters.from,
      to: filters.to,
      sort: filters.sort,
    }),
    enabled: Boolean(organizationId),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPurchaseRpc(
        await purchaseList({
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

export function usePurchaseSearch(q: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.purchases.search(organizationId ?? 'none', q),
    enabled: Boolean(organizationId) && q.trim().length >= 2,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPurchaseRpc(
        await purchaseSearch({
          data: { organizationId, query: { q, status: 'all', limit: 20 } },
        }),
      )
    },
  })
}

export function usePurchase(purchaseOrderId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.purchases.detail(organizationId ?? 'none', purchaseOrderId),
    enabled: Boolean(organizationId && purchaseOrderId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPurchaseRpc(
        await purchaseGetSnapshot({
          data: { organizationId, purchaseOrderId },
        }),
      )
    },
  })
}

export function usePurchaseItems(purchaseOrderId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.purchases.items(organizationId ?? 'none', purchaseOrderId),
    enabled: Boolean(organizationId && purchaseOrderId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPurchaseRpc(
        await purchaseListItems({
          data: { organizationId, purchaseOrderId },
        }),
      )
    },
  })
}

export function usePurchaseHistory(purchaseOrderId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.purchases.history(
      organizationId ?? 'none',
      purchaseOrderId,
    ),
    enabled: Boolean(organizationId && purchaseOrderId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPurchaseRpc(
        await purchaseListHistory({
          data: { organizationId, purchaseOrderId },
        }),
      )
    },
  })
}

export function useCreatePurchase() {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreatePurchaseInput) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPurchaseRpc(
        await purchaseCreate({ data: { organizationId, input } }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.purchases.all(organizationId),
      })
    },
  })
}

export function useUpdatePurchase(purchaseOrderId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdatePurchaseInput) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPurchaseRpc(
        await purchaseUpdate({
          data: { organizationId, purchaseOrderId, input },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.purchases.all(organizationId),
      })
    },
  })
}

function usePurchaseLifecycleMutation(
  fn: (args: {
    data: { organizationId: string; purchaseOrderId: string; reason?: string | null }
  }) => Promise<unknown>,
) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (args: string | { purchaseOrderId: string; reason?: string | null }) => {
      if (!organizationId) throw new Error('missing_org')
      const purchaseOrderId =
        typeof args === 'string' ? args : args.purchaseOrderId
      const reason = typeof args === 'string' ? undefined : args.reason
      return unwrapPurchaseRpc(
        (await fn({
          data: { organizationId, purchaseOrderId, reason },
        })) as Awaited<ReturnType<typeof purchaseApprove>>,
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.purchases.all(organizationId),
      })
    },
  })
}

export function useApprovePurchase() {
  return usePurchaseLifecycleMutation(purchaseApprove)
}

export function useSendPurchase() {
  return usePurchaseLifecycleMutation(purchaseSend)
}

export function useConfirmPurchase() {
  return usePurchaseLifecycleMutation(purchaseConfirm)
}

export function useClosePurchase() {
  return usePurchaseLifecycleMutation(purchaseClose)
}

export function useCancelPurchase() {
  return usePurchaseLifecycleMutation(purchaseCancel)
}

export function useArchivePurchase() {
  return usePurchaseLifecycleMutation(purchaseArchive)
}

export function useRestorePurchase() {
  return usePurchaseLifecycleMutation(purchaseRestore)
}

export function useAddPurchaseItem(purchaseOrderId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<AddPurchaseItemInput, 'purchaseOrderId'>) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPurchaseRpc(
        await purchaseAddItem({
          data: {
            organizationId,
            input: { ...input, purchaseOrderId },
          },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.purchases.detail(organizationId, purchaseOrderId),
      })
    },
  })
}

export function useUpdatePurchaseItem(purchaseOrderId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      itemId,
      input,
    }: {
      itemId: string
      input: UpdatePurchaseItemInput
    }) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPurchaseRpc(
        await purchaseUpdateItem({
          data: { organizationId, itemId, input },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.purchases.detail(organizationId, purchaseOrderId),
      })
    },
  })
}

export function useRemovePurchaseItem(purchaseOrderId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapPurchaseRpc(
        await purchaseRemoveItem({
          data: { organizationId, itemId },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.purchases.detail(organizationId, purchaseOrderId),
      })
    },
  })
}

export function toFormError(error: unknown): {
  formError: string | null
  fieldErrors: Record<string, string>
} {
  if (error instanceof PurchaseRpcClientError) {
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
