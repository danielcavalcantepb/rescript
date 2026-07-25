import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '#/platform/cache/query-keys'
import { useOrganization } from '#/platform/organization/organization-context'
import { usePermission } from '#/platform/permissions'
import { useSession } from '#/providers/app-session'
import {
  InventoryValidationError,
  InsufficientStockError,
  inventoryErrorMessage,
  registerAdjustment,
  registerEntry,
  registerExit,
  supabaseInventoryRepository,
  type RegisterAdjustmentInput,
  type RegisterEntryInput,
  type RegisterExitInput,
} from '#/modules/inventory'

export function useInventoryActions() {
  const { currentOrganization } = useOrganization()
  const { authUser } = useSession()
  const { can } = usePermission()
  const queryClient = useQueryClient()

  const organizationId = currentOrganization?.id
  const userId = authUser?.id

  function invalidateAll() {
    if (!organizationId) return
    void queryClient.invalidateQueries({
      queryKey: queryKeys.inventory.all(organizationId),
    })
  }

  const entry = useMutation({
    mutationFn: async (input: RegisterEntryInput) => {
      if (!organizationId || !userId) throw new Error('missing_context')
      return registerEntry({
        repository: supabaseInventoryRepository,
        can,
        organizationId,
        userId,
        input,
      })
    },
    onSuccess: invalidateAll,
  })

  const exit = useMutation({
    mutationFn: async (input: RegisterExitInput) => {
      if (!organizationId || !userId) throw new Error('missing_context')
      return registerExit({
        repository: supabaseInventoryRepository,
        can,
        organizationId,
        userId,
        input,
      })
    },
    onSuccess: invalidateAll,
  })

  const adjustment = useMutation({
    mutationFn: async (input: RegisterAdjustmentInput) => {
      if (!organizationId || !userId) throw new Error('missing_context')
      return registerAdjustment({
        repository: supabaseInventoryRepository,
        can,
        organizationId,
        userId,
        input,
      })
    },
    onSuccess: invalidateAll,
  })

  return { entry, exit, adjustment, organizationId }
}

export function toMovementFormError(error: unknown): {
  formError: string | null
  fieldErrors: Record<string, string>
} {
  if (error instanceof InventoryValidationError) {
    return { formError: null, fieldErrors: error.fieldErrors }
  }
  if (error instanceof InsufficientStockError) {
    return {
      formError: error.message,
      fieldErrors: { quantity: error.message },
    }
  }
  return {
    formError: inventoryErrorMessage(error),
    fieldErrors: {},
  }
}

/** Build use-case input from form values (quantity as number). */
export function movementFormToEntryInput(
  values: {
    productId: string
    quantity: string
    reason: string
    notes: string
    occurredAt: string
  },
): RegisterEntryInput {
  return {
    productId: values.productId,
    quantity: Number(values.quantity),
    reason: values.reason,
    notes: values.notes || null,
    occurredAt: values.occurredAt
      ? new Date(values.occurredAt).toISOString()
      : null,
  }
}

export function movementFormToExitInput(
  values: {
    productId: string
    quantity: string
    reason: string
    notes: string
    occurredAt: string
  },
): RegisterExitInput {
  return movementFormToEntryInput(values)
}

export function movementFormToAdjustmentInput(values: {
  productId: string
  quantity: string
  reason: string
  notes: string
  occurredAt: string
  direction: 'in' | 'out'
}): RegisterAdjustmentInput {
  return {
    ...movementFormToEntryInput(values),
    direction: values.direction,
  }
}
