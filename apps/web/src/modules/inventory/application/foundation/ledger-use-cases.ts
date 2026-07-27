import type {
  CreateAdjustmentCommand,
  CreateEntryCommand,
  CreateExitCommand,
  CreateTransferCommand,
  LedgerMovementResponse,
  ListMovementsQuery,
  MovementResultResponse,
  ReverseMovementCommand,
} from '#/modules/inventory/application/foundation/ledger-dto'
import {
  requireInventoryRead,
  requireLedgerAdjust,
  requireLedgerCreate,
  requireLedgerRead,
  requireLedgerReverse,
  requireLedgerTransfer,
  type InventoryFoundationDeps,
} from '#/modules/inventory/application/foundation/deps'
import {
  InventoryFoundationConflictError,
  InventoryFoundationNotFoundError,
  InventoryFoundationPermissionError,
  InventoryFoundationValidationError,
} from '#/modules/inventory/application/foundation/errors'
import {
  toLedgerMovementResponse,
  toMovementResultResponse,
} from '#/modules/inventory/application/foundation/ledger-mappers'
import { MovementPolicy } from '#/modules/inventory/domain/ledger/movement-policy'

function assertPositiveQuantity(quantity: number) {
  if (!(quantity > 0) || !Number.isFinite(quantity)) {
    throw new InventoryFoundationValidationError({
      quantity: 'Quantidade deve ser positiva.',
    })
  }
}

async function assertMovable(
  deps: InventoryFoundationDeps,
  variantId: string,
  locationId: string,
  quantity: number,
  reason: string,
  type: 'entry' | 'exit' | 'adjustment_in' | 'adjustment_out',
) {
  assertPositiveQuantity(quantity)
  if (!reason.trim()) {
    throw new InventoryFoundationValidationError({
      reason: 'Motivo obrigatório.',
    })
  }
  const lookup = await deps.variantLookup.lookupVariant(variantId)
  if (!lookup || lookup.organizationId !== deps.organizationId) {
    throw new InventoryFoundationNotFoundError('variant_not_found')
  }
  const location = await deps.locations.getById(
    deps.organizationId,
    locationId,
  )
  if (!location) {
    throw new InventoryFoundationNotFoundError('location_not_found')
  }
  const item = await deps.items.getByVariantAndLocation(
    deps.organizationId,
    variantId,
    locationId,
  )
  const policy = MovementPolicy.validate({
    type,
    quantity,
    reason,
    location,
    lookup,
    currentOnHand: item?.quantityOnHand ?? 0,
  })
  if (!policy.ok) {
    throw new InventoryFoundationConflictError(policy.code)
  }
  return { lookup, location }
}

export async function createEntry(
  deps: InventoryFoundationDeps,
  command: CreateEntryCommand,
): Promise<MovementResultResponse> {
  if (!requireLedgerCreate(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  await assertMovable(
    deps,
    command.variantId,
    command.locationId,
    command.quantity,
    command.reason,
    'entry',
  )
  const result = await deps.ledger.registerMovement(deps.organizationId, {
    variantId: command.variantId,
    locationId: command.locationId,
    type: 'entry',
    quantity: command.quantity,
    reason: command.reason,
    notes: command.notes,
    idempotencyKey: command.idempotencyKey,
  })
  deps.events.append([
    {
      type: 'InventoryMovementCreated',
      organizationId: deps.organizationId,
      movementId: result.movement.id,
      movementType: 'entry',
      variantId: result.movement.variantId,
      locationId: result.movement.locationId,
    },
    {
      type: 'BalanceProjected',
      organizationId: deps.organizationId,
      inventoryItemId: result.movement.inventoryItemId,
      afterQuantity: result.projection.quantityOnHand,
    },
  ])
  return toMovementResultResponse(result)
}

export async function createExit(
  deps: InventoryFoundationDeps,
  command: CreateExitCommand,
): Promise<MovementResultResponse> {
  if (!requireLedgerCreate(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  await assertMovable(
    deps,
    command.variantId,
    command.locationId,
    command.quantity,
    command.reason,
    'exit',
  )
  const result = await deps.ledger.registerMovement(deps.organizationId, {
    variantId: command.variantId,
    locationId: command.locationId,
    type: 'exit',
    quantity: command.quantity,
    reason: command.reason,
    notes: command.notes,
    idempotencyKey: command.idempotencyKey,
  })
  deps.events.append([
    {
      type: 'InventoryMovementCreated',
      organizationId: deps.organizationId,
      movementId: result.movement.id,
      movementType: 'exit',
      variantId: result.movement.variantId,
      locationId: result.movement.locationId,
    },
    {
      type: 'BalanceProjected',
      organizationId: deps.organizationId,
      inventoryItemId: result.movement.inventoryItemId,
      afterQuantity: result.projection.quantityOnHand,
    },
  ])
  return toMovementResultResponse(result)
}

export async function createAdjustment(
  deps: InventoryFoundationDeps,
  command: CreateAdjustmentCommand,
): Promise<MovementResultResponse> {
  if (!requireLedgerAdjust(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const type =
    command.direction === 'in' ? 'adjustment_in' : 'adjustment_out'
  await assertMovable(
    deps,
    command.variantId,
    command.locationId,
    command.quantity,
    command.reason,
    type,
  )
  const result = await deps.ledger.registerMovement(deps.organizationId, {
    variantId: command.variantId,
    locationId: command.locationId,
    type,
    quantity: command.quantity,
    reason: command.reason,
    notes: command.notes,
    idempotencyKey: command.idempotencyKey,
  })
  deps.events.append([
    {
      type: 'InventoryAdjusted',
      organizationId: deps.organizationId,
      movementId: result.movement.id,
      variantId: result.movement.variantId,
      locationId: result.movement.locationId,
    },
    {
      type: 'BalanceProjected',
      organizationId: deps.organizationId,
      inventoryItemId: result.movement.inventoryItemId,
      afterQuantity: result.projection.quantityOnHand,
    },
  ])
  return toMovementResultResponse(result)
}

export async function createTransfer(
  deps: InventoryFoundationDeps,
  command: CreateTransferCommand,
): Promise<MovementResultResponse> {
  if (!requireLedgerTransfer(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  assertPositiveQuantity(command.quantity)
  if (!command.reason.trim()) {
    throw new InventoryFoundationValidationError({
      reason: 'Motivo obrigatório.',
    })
  }
  if (command.fromLocationId === command.toLocationId) {
    throw new InventoryFoundationConflictError('transfer_same_location')
  }

  const lookup = await deps.variantLookup.lookupVariant(command.variantId)
  if (!lookup || lookup.organizationId !== deps.organizationId) {
    throw new InventoryFoundationNotFoundError('variant_not_found')
  }
  const from = await deps.locations.getById(
    deps.organizationId,
    command.fromLocationId,
  )
  const to = await deps.locations.getById(
    deps.organizationId,
    command.toLocationId,
  )
  if (!from || !to) {
    throw new InventoryFoundationNotFoundError('location_not_found')
  }
  const item = await deps.items.getByVariantAndLocation(
    deps.organizationId,
    command.variantId,
    command.fromLocationId,
  )
  const policy = MovementPolicy.validate({
    type: 'transfer_out',
    quantity: command.quantity,
    reason: command.reason,
    location: from,
    lookup,
    currentOnHand: item?.quantityOnHand ?? 0,
    toLocation: to,
  })
  if (!policy.ok) {
    throw new InventoryFoundationConflictError(policy.code)
  }

  const result = await deps.ledger.registerTransfer(deps.organizationId, {
    variantId: command.variantId,
    fromLocationId: command.fromLocationId,
    toLocationId: command.toLocationId,
    quantity: command.quantity,
    reason: command.reason,
    notes: command.notes,
    idempotencyKey: command.idempotencyKey,
  })
  deps.events.append([
    {
      type: 'InventoryTransferred',
      organizationId: deps.organizationId,
      correlationId: result.movement.correlationId ?? result.movement.id,
      variantId: command.variantId,
      fromLocationId: command.fromLocationId,
      toLocationId: command.toLocationId,
    },
    {
      type: 'BalanceProjected',
      organizationId: deps.organizationId,
      inventoryItemId: result.movement.inventoryItemId,
      afterQuantity: result.projection.quantityOnHand,
    },
  ])
  return toMovementResultResponse(result)
}

export async function reverseMovement(
  deps: InventoryFoundationDeps,
  command: ReverseMovementCommand,
): Promise<MovementResultResponse> {
  if (!requireLedgerReverse(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  if (!command.reason.trim()) {
    throw new InventoryFoundationValidationError({
      reason: 'Motivo obrigatório.',
    })
  }
  const existing = await deps.ledger.getById(
    deps.organizationId,
    command.movementId,
  )
  if (!existing) {
    throw new InventoryFoundationNotFoundError('movement_not_found')
  }
  if (existing.type === 'reversal') {
    throw new InventoryFoundationConflictError('cannot_reverse_reversal')
  }

  const result = await deps.ledger.reverseMovement(deps.organizationId, {
    movementId: command.movementId,
    reason: command.reason,
    notes: command.notes,
    idempotencyKey: command.idempotencyKey,
  })
  deps.events.append([
    {
      type: 'InventoryReversed',
      organizationId: deps.organizationId,
      movementId: result.movement.id,
      reversesMovementId: command.movementId,
    },
    {
      type: 'BalanceProjected',
      organizationId: deps.organizationId,
      inventoryItemId: result.movement.inventoryItemId,
      afterQuantity: result.projection.quantityOnHand,
    },
  ])
  return toMovementResultResponse(result)
}

export async function listMovements(
  deps: InventoryFoundationDeps,
  query: ListMovementsQuery = {},
): Promise<LedgerMovementResponse[]> {
  if (!requireLedgerRead(deps.can) && !requireInventoryRead(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const result = await deps.ledger.list(deps.organizationId, {
    variantId: query.variantId,
    locationId: query.locationId,
    inventoryItemId: query.inventoryItemId,
    type: query.type,
    limit: query.limit,
  })
  return result.items.map(toLedgerMovementResponse)
}

export async function getMovement(
  deps: InventoryFoundationDeps,
  movementId: string,
): Promise<LedgerMovementResponse> {
  if (!requireLedgerRead(deps.can) && !requireInventoryRead(deps.can)) {
    throw new InventoryFoundationPermissionError()
  }
  const movement = await deps.ledger.getById(deps.organizationId, movementId)
  if (!movement) {
    throw new InventoryFoundationNotFoundError('movement_not_found')
  }
  return toLedgerMovementResponse(movement)
}

export async function getInventoryHistory(
  deps: InventoryFoundationDeps,
  query: { variantId?: string; inventoryItemId?: string; limit?: number },
): Promise<LedgerMovementResponse[]> {
  return listMovements(deps, query)
}
