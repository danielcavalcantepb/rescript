import type { PermissionKey } from '@rescript/permissions'
import {
  noopInventoryAudit,
  type InventoryAuditPort,
} from '#/modules/inventory/application/audit'
import {
  InventoryValidationError,
  PermissionError,
  ProductArchivedError,
  mapRepositoryError,
} from '#/modules/inventory/application/errors'
import type {
  CreateMovementInput,
  InventoryMovement,
  InventoryRepository,
} from '#/modules/inventory/domain/types'
import {
  hasFieldErrors,
  validateCreateMovement,
} from '#/modules/inventory/domain/validation'

type Can = (key: PermissionKey) => boolean

export type RegisterAdjustmentInput = Omit<CreateMovementInput, 'type'> & {
  direction: 'in' | 'out'
}

export async function registerAdjustment(deps: {
  repository: InventoryRepository
  can: Can
  organizationId: string
  userId: string
  input: RegisterAdjustmentInput
  audit?: InventoryAuditPort
}): Promise<InventoryMovement> {
  if (!deps.can('inventory.adjust')) {
    throw new PermissionError()
  }

  const type =
    deps.input.direction === 'in' ? 'adjustment_in' : 'adjustment_out'
  const { direction: _direction, ...fields } = deps.input
  const input: CreateMovementInput = { ...fields, type }
  const errors = validateCreateMovement(input)
  if (hasFieldErrors(errors)) throw new InventoryValidationError(errors)

  const stock = await deps.repository.getProductStock(
    deps.organizationId,
    input.productId,
  )
  if (stock?.status === 'inactive') throw new ProductArchivedError()

  try {
    const movement = await deps.repository.registerMovement(
      deps.organizationId,
      input,
    )
    ;(deps.audit ?? noopInventoryAudit).record({
      action:
        type === 'adjustment_in'
          ? 'inventory.adjustment_in'
          : 'inventory.adjustment_out',
      organizationId: deps.organizationId,
      productId: movement.productId,
      movementId: movement.id,
      actorUserId: deps.userId,
    })
    return movement
  } catch (error) {
    mapRepositoryError(error)
  }
}
