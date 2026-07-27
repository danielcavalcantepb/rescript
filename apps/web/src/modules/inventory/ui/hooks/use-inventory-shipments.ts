import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CancelInventoryShipmentInput,
  CompleteInventoryShipmentInput,
  CreateInventoryShipmentInput,
  DispatchInventoryShipmentInput,
  InventoryShipmentListQuery,
  MarkInventoryShipmentReadyInput,
} from '#/modules/inventory/domain/shipment/types'
import { inventoryQueryKeys } from '#/platform/cache/inventory-query-keys'
import {
  cancelInventoryShipment,
  completeInventoryShipment,
  createInventoryShipment,
  dispatchInventoryShipment,
  getInventoryShipment,
  listInventoryShipments,
  markInventoryShipmentReady,
  type ShipmentRpcResult,
} from '../shipment-api'

function unwrap<T>(result: ShipmentRpcResult<T>) {
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

export function useInventoryShipments(
  organizationId: string | undefined,
  query?: InventoryShipmentListQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.shipments(organizationId ?? 'none', query ?? {}),
    enabled: Boolean(organizationId) && enabled,
    queryFn: async () =>
      unwrap(
        await listInventoryShipments({
          data: { organizationId: organizationId!, query },
        }),
      ),
  })
}

export function useInventoryShipment(
  organizationId: string | undefined,
  shipmentId: string | undefined,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.shipmentDetail(
      organizationId ?? 'none',
      shipmentId ?? 'none',
    ),
    enabled: Boolean(organizationId && shipmentId),
    queryFn: async () =>
      unwrap(
        await getInventoryShipment({
          data: {
            organizationId: organizationId!,
            shipmentId: shipmentId!,
          },
        }),
      ),
  })
}

export function useCreateInventoryShipment(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateInventoryShipmentInput) =>
      unwrap(
        await createInventoryShipment({
          data: { organizationId: organizationId!, input },
        }),
      ),
    onSuccess: async (shipmentId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.shipmentDetail(organizationId, shipmentId),
      })
    },
  })
}

export function useMarkInventoryShipmentReady(
  organizationId: string | undefined,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: MarkInventoryShipmentReadyInput) =>
      unwrap(
        await markInventoryShipmentReady({
          data: { organizationId: organizationId!, input },
        }),
      ),
    onSuccess: async (shipmentId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.shipmentDetail(organizationId, shipmentId),
      })
    },
  })
}

export function useDispatchInventoryShipment(
  organizationId: string | undefined,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: DispatchInventoryShipmentInput) =>
      unwrap(
        await dispatchInventoryShipment({
          data: { organizationId: organizationId!, input },
        }),
      ),
    onSuccess: async (shipmentId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.shipmentDetail(organizationId, shipmentId),
      })
    },
  })
}

export function useCompleteInventoryShipment(
  organizationId: string | undefined,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CompleteInventoryShipmentInput) =>
      unwrap(
        await completeInventoryShipment({
          data: { organizationId: organizationId!, input },
        }),
      ),
    onSuccess: async (shipmentId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.shipmentDetail(organizationId, shipmentId),
      })
    },
  })
}

export function useCancelInventoryShipment(
  organizationId: string | undefined,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CancelInventoryShipmentInput) =>
      unwrap(
        await cancelInventoryShipment({
          data: { organizationId: organizationId!, input },
        }),
      ),
    onSuccess: async (shipmentId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.shipmentDetail(organizationId, shipmentId),
      })
    },
  })
}
