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

export type RegisterEntryInput = Omit<CreateMovementInput, 'type'>

export async function registerEntry(deps: {
  repository: InventoryRepository
  can: Can
  organizationId: string
  userId: string
  input: RegisterEntryInput
  audit?: InventoryAuditPort
}): Promise<InventoryMovement> {
  if (!deps.can('inventory.move')) {
    throw new PermissionError()
  }

  const input: CreateMovementInput = { ...deps.input, type: 'entry' }
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
      action: 'inventory.entry',
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
