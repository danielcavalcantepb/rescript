import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import type {
  CreateReceiptInput,
  ListReceiptsQuery,
  PostReceiptInput,
  UpdateReceiptItemInput,
} from '#/modules/receiving/domain/types'
import {
  receivingArchive,
  receivingCancel,
  receivingCreate,
  receivingGetSnapshot,
  receivingList,
  receivingListHistory,
  receivingPost,
  receivingReceiveComplete,
  receivingReceivePartial,
  receivingRestore,
  receivingSearch,
  receivingUpdateItem,
} from '#/modules/receiving/ui/receiving-api'
import {
  ReceivingRpcClientError,
  unwrapReceivingRpc,
} from '#/modules/receiving/ui/errors/receiving-rpc-errors'

function useOrgId() {
  const { currentOrganization } = useOrganization()
  return currentOrganization?.id
}

export function useReceipts(filters: ListReceiptsQuery) {
  const organizationId = useOrgId()
  return useInfiniteQuery({
    queryKey: queryKeys.receiving.list(organizationId ?? 'none', {
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
      return unwrapReceivingRpc(
        await receivingList({
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

export function useReceiptSearch(q: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.receiving.search(organizationId ?? 'none', q),
    enabled: Boolean(organizationId) && q.trim().length >= 2,
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapReceivingRpc(
        await receivingSearch({
          data: { organizationId, query: { q, status: 'all', limit: 20 } },
        }),
      )
    },
  })
}

export function useReceipt(goodsReceiptId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.receiving.detail(organizationId ?? 'none', goodsReceiptId),
    enabled: Boolean(organizationId && goodsReceiptId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapReceivingRpc(
        await receivingGetSnapshot({
          data: { organizationId, goodsReceiptId },
        }),
      )
    },
  })
}

export function useReceiptHistory(goodsReceiptId: string) {
  const organizationId = useOrgId()
  return useQuery({
    queryKey: queryKeys.receiving.history(
      organizationId ?? 'none',
      goodsReceiptId,
    ),
    enabled: Boolean(organizationId && goodsReceiptId),
    queryFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapReceivingRpc(
        await receivingListHistory({
          data: { organizationId, goodsReceiptId },
        }),
      )
    },
  })
}

export function useCreateReceipt() {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateReceiptInput) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapReceivingRpc(
        await receivingCreate({ data: { organizationId, input } }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.receiving.all(organizationId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.purchases.all(organizationId),
      })
    },
  })
}

export function usePostReceipt(goodsReceiptId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Omit<PostReceiptInput, 'goodsReceiptId'>) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapReceivingRpc(
        await receivingPost({
          data: {
            organizationId,
            input: { ...input, goodsReceiptId },
          },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.receiving.all(organizationId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.purchases.all(organizationId),
      })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.all(organizationId),
      })
    },
  })
}

export function useUpdateReceiptItem(goodsReceiptId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      itemId,
      input,
    }: {
      itemId: string
      input: UpdateReceiptItemInput
    }) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapReceivingRpc(
        await receivingUpdateItem({
          data: { organizationId, itemId, input },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.receiving.detail(organizationId, goodsReceiptId),
      })
    },
  })
}

export function useReceivePartial(goodsReceiptId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      lines: Array<{ itemId: string; receivedQuantity: string }>,
    ) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapReceivingRpc(
        await receivingReceivePartial({
          data: { organizationId, goodsReceiptId, lines },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.receiving.detail(organizationId, goodsReceiptId),
      })
    },
  })
}

export function useReceiveComplete(goodsReceiptId: string) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapReceivingRpc(
        await receivingReceiveComplete({
          data: { organizationId, goodsReceiptId },
        }),
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.receiving.detail(organizationId, goodsReceiptId),
      })
    },
  })
}

function useReceiptLifecycleMutation(
  fn: (args: {
    data: { organizationId: string; goodsReceiptId: string }
  }) => Promise<unknown>,
) {
  const organizationId = useOrgId()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (goodsReceiptId: string) => {
      if (!organizationId) throw new Error('missing_org')
      return unwrapReceivingRpc(
        (await fn({
          data: { organizationId, goodsReceiptId },
        })) as Awaited<ReturnType<typeof receivingCancel>>,
      )
    },
    onSuccess: () => {
      if (!organizationId) return
      void queryClient.invalidateQueries({
        queryKey: queryKeys.receiving.all(organizationId),
      })
    },
  })
}

export function useCancelReceipt() {
  return useReceiptLifecycleMutation(receivingCancel)
}

export function useArchiveReceipt() {
  return useReceiptLifecycleMutation(receivingArchive)
}

export function useRestoreReceipt() {
  return useReceiptLifecycleMutation(receivingRestore)
}

export function toFormError(error: unknown): {
  formError: string | null
  fieldErrors: Record<string, string>
} {
  if (error instanceof ReceivingRpcClientError) {
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
