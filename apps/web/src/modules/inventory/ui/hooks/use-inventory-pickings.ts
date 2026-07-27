import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateInventoryPickingInput,
  InventoryPickingListQuery,
  UpdateInventoryPickingItemsInput,
} from '#/modules/inventory/domain/picking/types'
import { inventoryQueryKeys } from '#/platform/cache/inventory-query-keys'
import {
  cancelInventoryPicking,
  completeInventoryPicking,
  createInventoryPicking,
  getInventoryPicking,
  listInventoryPickings,
  startInventoryPicking,
  updateInventoryPickingItems,
  type PickingRpcResult,
} from '../picking-api'

function unwrap<T>(result: PickingRpcResult<T>) {
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

export function useInventoryPickings(
  organizationId: string | undefined,
  query?: InventoryPickingListQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.pickings(organizationId ?? 'none', query ?? {}),
    enabled: Boolean(organizationId) && enabled,
    queryFn: async () =>
      unwrap(
        await listInventoryPickings({
          data: { organizationId: organizationId!, query },
        }),
      ),
  })
}

export function useInventoryPicking(
  organizationId: string | undefined,
  pickingId: string | undefined,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.pickingDetail(
      organizationId ?? 'none',
      pickingId ?? 'none',
    ),
    enabled: Boolean(organizationId && pickingId),
    queryFn: async () =>
      unwrap(
        await getInventoryPicking({
          data: {
            organizationId: organizationId!,
            pickingId: pickingId!,
          },
        }),
      ),
  })
}

export function useCreateInventoryPicking(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateInventoryPickingInput) =>
      unwrap(
        await createInventoryPicking({
          data: { organizationId: organizationId!, input },
        }),
      ),
    onSuccess: async (pickingId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.pickingDetail(organizationId, pickingId),
      })
    },
  })
}

export function useStartInventoryPicking(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (pickingId: string) =>
      unwrap(
        await startInventoryPicking({
          data: { organizationId: organizationId!, pickingId },
        }),
      ),
    onSuccess: async (pickingId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.pickingDetail(organizationId, pickingId),
      })
    },
  })
}

export function useUpdateInventoryPickingItems(
  organizationId: string | undefined,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateInventoryPickingItemsInput) =>
      unwrap(
        await updateInventoryPickingItems({
          data: { organizationId: organizationId!, input },
        }),
      ),
    onSuccess: async (pickingId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.pickingDetail(organizationId, pickingId),
      })
    },
  })
}

export function useCompleteInventoryPicking(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (pickingId: string) =>
      unwrap(
        await completeInventoryPicking({
          data: { organizationId: organizationId!, pickingId },
        }),
      ),
    onSuccess: async (pickingId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.pickingDetail(organizationId, pickingId),
      })
    },
  })
}

export function useCancelInventoryPicking(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { pickingId: string; reason?: string | null }) =>
      unwrap(
        await cancelInventoryPicking({
          data: {
            organizationId: organizationId!,
            pickingId: input.pickingId,
            reason: input.reason ?? null,
          },
        }),
      ),
    onSuccess: async (pickingId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.pickingDetail(organizationId, pickingId),
      })
    },
  })
}
