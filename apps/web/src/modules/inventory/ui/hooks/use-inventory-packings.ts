import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateInventoryPackingInput,
  InventoryPackingListQuery,
} from '#/modules/inventory/domain/packing/types'
import { inventoryQueryKeys } from '#/platform/cache/inventory-query-keys'
import {
  cancelInventoryPacking,
  completeInventoryPacking,
  createInventoryPacking,
  getInventoryPacking,
  listInventoryPackings,
  startInventoryPacking,
  type PackingRpcResult,
} from '../packing-api'

function unwrap<T>(result: PackingRpcResult<T>) {
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

export function useInventoryPackings(
  organizationId: string | undefined,
  query?: InventoryPackingListQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.packings(organizationId ?? 'none', query ?? {}),
    enabled: Boolean(organizationId) && enabled,
    queryFn: async () =>
      unwrap(
        await listInventoryPackings({
          data: { organizationId: organizationId!, query },
        }),
      ),
  })
}

export function useInventoryPacking(
  organizationId: string | undefined,
  packingId: string | undefined,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.packingDetail(
      organizationId ?? 'none',
      packingId ?? 'none',
    ),
    enabled: Boolean(organizationId && packingId),
    queryFn: async () =>
      unwrap(
        await getInventoryPacking({
          data: {
            organizationId: organizationId!,
            packingId: packingId!,
          },
        }),
      ),
  })
}

export function useCreateInventoryPacking(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateInventoryPackingInput) =>
      unwrap(
        await createInventoryPacking({
          data: { organizationId: organizationId!, input },
        }),
      ),
    onSuccess: async (packingId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.packingDetail(organizationId, packingId),
      })
    },
  })
}

export function useStartInventoryPacking(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (packingId: string) =>
      unwrap(
        await startInventoryPacking({
          data: { organizationId: organizationId!, packingId },
        }),
      ),
    onSuccess: async (packingId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.packingDetail(organizationId, packingId),
      })
    },
  })
}

export function useCompleteInventoryPacking(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (packingId: string) =>
      unwrap(
        await completeInventoryPacking({
          data: { organizationId: organizationId!, packingId },
        }),
      ),
    onSuccess: async (packingId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.packingDetail(organizationId, packingId),
      })
    },
  })
}

export function useCancelInventoryPacking(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { packingId: string; reason?: string | null }) =>
      unwrap(
        await cancelInventoryPacking({
          data: {
            organizationId: organizationId!,
            packingId: input.packingId,
            reason: input.reason ?? null,
          },
        }),
      ),
    onSuccess: async (packingId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.packingDetail(organizationId, packingId),
      })
    },
  })
}
