import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { inventoryQueryKeys } from '#/platform/cache/inventory-query-keys'
import type {
  CreateInventoryItemCommand,
  CreateLocationCommand,
  UpdateInventoryItemCommand,
  UpdateLocationCommand,
} from '#/modules/inventory/ui/api/contracts'
import type {
  CreateAdjustmentCommand,
  CreateEntryCommand,
  CreateExitCommand,
  CreateTransferCommand,
  ListMovementsQuery,
  ReverseMovementCommand,
} from '#/modules/inventory/application/foundation/ledger-dto'
import {
  inventoryActivateLocation,
  inventoryArchiveLocation,
  inventoryCreateAdjustment,
  inventoryCreateEntry,
  inventoryCreateExit,
  inventoryCreateItem,
  inventoryCreateLocation,
  inventoryCreateTransfer,
  inventoryDeactivateLocation,
  inventoryGetAvailability,
  inventoryGetItem,
  inventoryGetLocation,
  inventoryGetMovement,
  inventoryGetVariantSummary,
  inventoryListItems,
  inventoryListLocations,
  inventoryListMovements,
  inventoryRestoreLocation,
  inventoryReverseMovement,
  inventoryUpdateItem,
  inventoryUpdateLocation,
} from '#/modules/inventory/ui/inventory-api'

function unwrap<T>(result: {
  ok: boolean
  data?: T
  error?: { message: string; code: string }
}): T {
  if (!result.ok || result.data === undefined) {
    throw new Error(result.error?.message ?? result.error?.code ?? 'rpc_error')
  }
  return result.data
}

export function useLocations(
  organizationId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.locations(organizationId ?? 'none'),
    enabled: Boolean(organizationId) && enabled,
    queryFn: async () =>
      unwrap(
        await inventoryListLocations({
          data: { organizationId: organizationId! },
        }),
      ),
  })
}

export function useLocation(
  organizationId: string | undefined,
  locationId: string | undefined,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.locationDetail(
      organizationId ?? 'none',
      locationId ?? 'none',
    ),
    enabled: Boolean(organizationId && locationId),
    queryFn: async () =>
      unwrap(
        await inventoryGetLocation({
          data: {
            organizationId: organizationId!,
            locationId: locationId!,
          },
        }),
      ),
  })
}

export function useInventory(
  organizationId: string | undefined,
  query?: { variantId?: string; locationId?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.items(organizationId ?? 'none', query),
    enabled: Boolean(organizationId) && enabled,
    queryFn: async () =>
      unwrap(
        await inventoryListItems({
          data: { organizationId: organizationId!, query },
        }),
      ),
  })
}

export function useInventoryItem(
  organizationId: string | undefined,
  inventoryItemId: string | undefined,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.itemDetail(
      organizationId ?? 'none',
      inventoryItemId ?? 'none',
    ),
    enabled: Boolean(organizationId && inventoryItemId),
    queryFn: async () =>
      unwrap(
        await inventoryGetItem({
          data: {
            organizationId: organizationId!,
            inventoryItemId: inventoryItemId!,
          },
        }),
      ),
  })
}

export function useAvailability(
  organizationId: string | undefined,
  variantId: string | undefined,
  locationId?: string,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.availability(
      organizationId ?? 'none',
      variantId ?? 'none',
      locationId,
    ),
    enabled: Boolean(organizationId && variantId),
    queryFn: async () =>
      unwrap(
        await inventoryGetAvailability({
          data: {
            organizationId: organizationId!,
            variantId: variantId!,
            locationId,
          },
        }),
      ),
  })
}

export function useVariantInventorySummary(
  organizationId: string | undefined,
  variantId: string | undefined,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.variantSummary(
      organizationId ?? 'none',
      variantId ?? 'none',
    ),
    enabled: Boolean(organizationId && variantId),
    queryFn: async () =>
      unwrap(
        await inventoryGetVariantSummary({
          data: {
            organizationId: organizationId!,
            variantId: variantId!,
          },
        }),
      ),
  })
}

export function useCreateLocation(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (command: CreateLocationCommand) =>
      unwrap(
        await inventoryCreateLocation({
          data: { organizationId: organizationId!, command },
        }),
      ),
    onSuccess: async () => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.locations(organizationId),
      })
    },
  })
}

export function useUpdateLocation(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (command: UpdateLocationCommand) =>
      unwrap(
        await inventoryUpdateLocation({
          data: { organizationId: organizationId!, command },
        }),
      ),
    onSuccess: async (data) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.locations(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.locationDetail(organizationId, data.id),
      })
    },
  })
}

export function useLocationLifecycle(organizationId: string | undefined) {
  const qc = useQueryClient()
  const invalidate = async (locationId: string) => {
    if (!organizationId) return
    await qc.invalidateQueries({
      queryKey: inventoryQueryKeys.locations(organizationId),
    })
    await qc.invalidateQueries({
      queryKey: inventoryQueryKeys.locationDetail(organizationId, locationId),
    })
  }
  return {
    activate: useMutation({
      mutationFn: async (locationId: string) =>
        unwrap(
          await inventoryActivateLocation({
            data: {
              organizationId: organizationId!,
              command: { locationId },
            },
          }),
        ),
      onSuccess: async (data) => invalidate(data.id),
    }),
    deactivate: useMutation({
      mutationFn: async (locationId: string) =>
        unwrap(
          await inventoryDeactivateLocation({
            data: {
              organizationId: organizationId!,
              command: { locationId },
            },
          }),
        ),
      onSuccess: async (data) => invalidate(data.id),
    }),
    archive: useMutation({
      mutationFn: async (locationId: string) =>
        unwrap(
          await inventoryArchiveLocation({
            data: {
              organizationId: organizationId!,
              command: { locationId },
            },
          }),
        ),
      onSuccess: async (data) => invalidate(data.id),
    }),
    restore: useMutation({
      mutationFn: async (locationId: string) =>
        unwrap(
          await inventoryRestoreLocation({
            data: {
              organizationId: organizationId!,
              command: { locationId },
            },
          }),
        ),
      onSuccess: async (data) => invalidate(data.id),
    }),
  }
}

export function useCreateInventoryItem(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (command: CreateInventoryItemCommand) =>
      unwrap(
        await inventoryCreateItem({
          data: { organizationId: organizationId!, command },
        }),
      ),
    onSuccess: async (data) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.variantSummary(
          organizationId,
          data.variantId,
        ),
      })
    },
  })
}

export function useUpdateInventoryItem(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (command: UpdateInventoryItemCommand) =>
      unwrap(
        await inventoryUpdateItem({
          data: { organizationId: organizationId!, command },
        }),
      ),
    onSuccess: async (data) => {
      if (!organizationId) return
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.all(organizationId),
      })
      await qc.invalidateQueries({
        queryKey: inventoryQueryKeys.variantSummary(
          organizationId,
          data.variantId,
        ),
      })
    },
  })
}

async function invalidateLedgerCaches(
  qc: ReturnType<typeof useQueryClient>,
  organizationId: string,
) {
  await qc.invalidateQueries({
    queryKey: inventoryQueryKeys.all(organizationId),
  })
}

export function useMovements(
  organizationId: string | undefined,
  query?: ListMovementsQuery,
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.movements(organizationId ?? 'none', query),
    enabled: Boolean(organizationId) && enabled,
    queryFn: async () =>
      unwrap(
        await inventoryListMovements({
          data: { organizationId: organizationId!, query },
        }),
      ),
  })
}

export function useMovement(
  organizationId: string | undefined,
  movementId: string | undefined,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.movementDetail(
      organizationId ?? 'none',
      movementId ?? 'none',
    ),
    enabled: Boolean(organizationId && movementId),
    queryFn: async () =>
      unwrap(
        await inventoryGetMovement({
          data: {
            organizationId: organizationId!,
            movementId: movementId!,
          },
        }),
      ),
  })
}

export function useCreateEntry(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (command: CreateEntryCommand) =>
      unwrap(
        await inventoryCreateEntry({
          data: { organizationId: organizationId!, command },
        }),
      ),
    onSuccess: async () => {
      if (!organizationId) return
      await invalidateLedgerCaches(qc, organizationId)
    },
  })
}

export function useCreateExit(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (command: CreateExitCommand) =>
      unwrap(
        await inventoryCreateExit({
          data: { organizationId: organizationId!, command },
        }),
      ),
    onSuccess: async () => {
      if (!organizationId) return
      await invalidateLedgerCaches(qc, organizationId)
    },
  })
}

export function useCreateAdjustment(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (command: CreateAdjustmentCommand) =>
      unwrap(
        await inventoryCreateAdjustment({
          data: { organizationId: organizationId!, command },
        }),
      ),
    onSuccess: async () => {
      if (!organizationId) return
      await invalidateLedgerCaches(qc, organizationId)
    },
  })
}

export function useCreateTransfer(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (command: CreateTransferCommand) =>
      unwrap(
        await inventoryCreateTransfer({
          data: { organizationId: organizationId!, command },
        }),
      ),
    onSuccess: async () => {
      if (!organizationId) return
      await invalidateLedgerCaches(qc, organizationId)
    },
  })
}

export function useReverseMovement(organizationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (command: ReverseMovementCommand) =>
      unwrap(
        await inventoryReverseMovement({
          data: { organizationId: organizationId!, command },
        }),
      ),
    onSuccess: async () => {
      if (!organizationId) return
      await invalidateLedgerCaches(qc, organizationId)
    },
  })
}
