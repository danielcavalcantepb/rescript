import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateInventoryReservationInput,
  InventoryReservationListQuery,
  ReleaseInventoryReservationInput,
} from '#/modules/inventory/domain/reservation/types'
import { inventoryQueryKeys } from '#/platform/cache/inventory-query-keys'
import {
  activateInventoryReservation,
  cancelInventoryReservation,
  createInventoryReservation,
  getInventoryReservation,
  listInventoryReservations,
  releaseInventoryReservation,
  type ReservationRpcResult,
} from '../reservation-api'

function unwrap<T>(result: ReservationRpcResult<T>) {
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}

export function useInventoryReservations(
  organizationId: string | undefined,
  query?: InventoryReservationListQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.reservations(
      organizationId ?? 'none',
      query ?? {},
    ),
    enabled: Boolean(organizationId) && enabled,
    queryFn: async () =>
      unwrap(
        await listInventoryReservations({
          data: { organizationId: organizationId!, query },
        }),
      ),
  })
}

export function useInventoryReservation(
  organizationId: string | undefined,
  reservationId: string | undefined,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.reservationDetail(
      organizationId ?? 'none',
      reservationId ?? 'none',
    ),
    enabled: Boolean(organizationId && reservationId),
    queryFn: async () =>
      unwrap(
        await getInventoryReservation({
          data: {
            organizationId: organizationId!,
            reservationId: reservationId!,
          },
        }),
      ),
  })
}

export function useCreateInventoryReservation(
  organizationId: string | undefined,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateInventoryReservationInput) =>
      unwrap(
        await createInventoryReservation({
          data: { organizationId: organizationId!, input },
        }),
      ),
    onSuccess: async () => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
    },
  })
}

export function useActivateInventoryReservation(
  organizationId: string | undefined,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reservationId: string) =>
      unwrap(
        await activateInventoryReservation({
          data: { organizationId: organizationId!, reservationId },
        }),
      ),
    onSuccess: async (reservationId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.reservationDetail(
          organizationId,
          reservationId,
        ),
      })
    },
  })
}

export function useReleaseInventoryReservation(
  organizationId: string | undefined,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ReleaseInventoryReservationInput) =>
      unwrap(
        await releaseInventoryReservation({
          data: { organizationId: organizationId!, input },
        }),
      ),
    onSuccess: async (reservationId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.reservationDetail(
          organizationId,
          reservationId,
        ),
      })
    },
  })
}

export function useCancelInventoryReservation(
  organizationId: string | undefined,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { reservationId: string; reason?: string | null }) =>
      unwrap(
        await cancelInventoryReservation({
          data: {
            organizationId: organizationId!,
            reservationId: input.reservationId,
            reason: input.reason ?? null,
          },
        }),
      ),
    onSuccess: async (reservationId) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.reservationDetail(
          organizationId,
          reservationId,
        ),
      })
    },
  })
}
