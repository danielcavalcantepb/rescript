import type {
  InventoryLedgerPort,
  ListLedgerMovementsQuery,
  RegisterLedgerMovementInput,
} from '#/modules/inventory/application/foundation/ledger-ports'
import type {
  InventoryItemRepository,
  InventoryVariantLookupPort,
  StockLocationRepository,
} from '#/modules/inventory/application/foundation/ports'
import { MovementPolicy } from '#/modules/inventory/domain/ledger/movement-policy'
import type {
  InventoryLedgerMovement,
  InventoryMovementResult,
  LedgerMovementType,
} from '#/modules/inventory/domain/ledger/types'
import { createInventoryItem } from '#/modules/inventory/domain/foundation/factories'
import { quantityAvailable } from '#/modules/inventory/domain/foundation/types'

/**
 * In-memory ledger for unit tests — mirrors RPC semantics (idempotency, locks as serial ops).
 */
export function createInMemoryInventoryLedger(deps: {
  locations: StockLocationRepository
  items: InventoryItemRepository
  variantLookup: InventoryVariantLookupPort
  ids: { next: () => string }
  clock: { nowIso: () => string }
  userId: string
}): InventoryLedgerPort {
  const movements: InventoryLedgerMovement[] = []

  async function project(
    organizationId: string,
    input: Omit<RegisterLedgerMovementInput, 'type'> & {
      type: LedgerMovementType
      reversesMovementId?: string | null
      signedDeltaOverride?: number
    },
  ): Promise<InventoryMovementResult> {
    if (input.idempotencyKey) {
      const existing = movements.find(
        (m) =>
          m.organizationId === organizationId &&
          m.idempotencyKey === input.idempotencyKey,
      )
      if (existing) {
        const item = await deps.items.getById(
          organizationId,
          existing.inventoryItemId,
        )
        return {
          movement: existing,
          projection: {
            variantId: existing.variantId,
            locationId: existing.locationId,
            quantityOnHand: item?.quantityOnHand ?? existing.afterQuantity,
            quantityReserved: item?.quantityReserved ?? 0,
            quantityAvailable: item
              ? quantityAvailable(item)
              : existing.afterQuantity,
            version: 0,
          },
          related: [],
        }
      }
    }

    const lookup = await deps.variantLookup.lookupVariant(input.variantId)
    if (!lookup || lookup.organizationId !== organizationId) {
      throw new Error('variant_not_found')
    }
    const location = await deps.locations.getById(
      organizationId,
      input.locationId,
    )
    if (!location) throw new Error('location_not_found')

    let item = await deps.items.getByVariantAndLocation(
      organizationId,
      input.variantId,
      input.locationId,
    )
    if (!item) {
      item = createInventoryItem({
        id: deps.ids.next(),
        organizationId,
        locationId: input.locationId,
        variantId: input.variantId,
        quantityOnHand: 0,
      })
      await deps.items.save(item)
    }

    const policy = MovementPolicy.validate({
      type: input.type,
      quantity: input.quantity,
      reason: input.reason,
      location,
      lookup,
      currentOnHand: item.quantityOnHand,
      reversesSignedDelta: input.signedDeltaOverride,
    })
    if (!policy.ok) throw new Error(policy.code)

    const movement: InventoryLedgerMovement = {
      id: deps.ids.next(),
      organizationId,
      variantId: input.variantId,
      locationId: input.locationId,
      inventoryItemId: item.id,
      type: input.type,
      quantity: input.quantity,
      signedDelta: policy.signedDelta,
      beforeQuantity: item.quantityOnHand,
      afterQuantity: policy.afterQuantity,
      reason: input.reason.trim(),
      notes: input.notes ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      correlationId: input.correlationId ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      reversesMovementId: input.reversesMovementId ?? null,
      occurredAt: input.occurredAt ?? deps.clock.nowIso(),
      createdAt: deps.clock.nowIso(),
      createdBy: deps.userId,
    }
    movements.push(movement)
    await deps.items.save({
      ...item,
      quantityOnHand: policy.afterQuantity,
      quantityReserved: 0,
    })
    return {
      movement,
      projection: {
        variantId: movement.variantId,
        locationId: movement.locationId,
        quantityOnHand: policy.afterQuantity,
        quantityReserved: 0,
        quantityAvailable: policy.afterQuantity,
        version: 1,
      },
      related: [],
    }
  }

  return {
    async registerMovement(organizationId, input) {
      return project(organizationId, input)
    },
    async registerTransfer(organizationId, input) {
      if (input.idempotencyKey) {
        const existing = movements.find(
          (m) =>
            m.organizationId === organizationId &&
            m.idempotencyKey === input.idempotencyKey &&
            m.type === 'transfer_out',
        )
        if (existing) {
          const related = movements.filter(
            (m) => m.correlationId === existing.correlationId,
          )
          const item = await deps.items.getById(
            organizationId,
            existing.inventoryItemId,
          )
          return {
            movement: existing,
            projection: {
              variantId: existing.variantId,
              locationId: existing.locationId,
              quantityOnHand: item?.quantityOnHand ?? existing.afterQuantity,
              quantityReserved: 0,
              quantityAvailable: item?.quantityOnHand ?? existing.afterQuantity,
              version: 0,
            },
            related,
          }
        }
      }
      const correlationId = deps.ids.next()
      const out = await project(organizationId, {
        variantId: input.variantId,
        locationId: input.fromLocationId,
        type: 'transfer_out',
        quantity: input.quantity,
        reason: input.reason,
        notes: input.notes,
        occurredAt: input.occurredAt,
        correlationId,
        idempotencyKey: input.idempotencyKey,
        referenceType: 'transfer',
      })
      const inn = await project(organizationId, {
        variantId: input.variantId,
        locationId: input.toLocationId,
        type: 'transfer_in',
        quantity: input.quantity,
        reason: input.reason,
        notes: input.notes,
        occurredAt: input.occurredAt,
        correlationId,
        idempotencyKey: input.idempotencyKey
          ? `${input.idempotencyKey}:in`
          : null,
        referenceType: 'transfer',
        referenceId: out.movement.id,
      })
      return {
        movement: out.movement,
        projection: out.projection,
        related: [out.movement, inn.movement],
      }
    },
    async reverseMovement(organizationId, input) {
      const target = movements.find(
        (m) => m.organizationId === organizationId && m.id === input.movementId,
      )
      if (!target) throw new Error('movement_not_found')
      if (target.type === 'reversal') throw new Error('cannot_reverse_reversal')
      if (
        movements.some(
          (m) =>
            m.reversesMovementId === target.id && m.type === 'reversal',
        )
      ) {
        throw new Error('movement_already_reversed')
      }
      return project(organizationId, {
        variantId: target.variantId,
        locationId: target.locationId,
        type: 'reversal',
        quantity: target.quantity,
        reason: input.reason,
        notes: input.notes,
        idempotencyKey: input.idempotencyKey,
        reversesMovementId: target.id,
        signedDeltaOverride: target.signedDelta,
      })
    },
    async getById(organizationId, movementId) {
      return (
        movements.find(
          (m) => m.organizationId === organizationId && m.id === movementId,
        ) ?? null
      )
    },
    async list(organizationId, query: ListLedgerMovementsQuery) {
      let items = movements.filter((m) => m.organizationId === organizationId)
      if (query.variantId) {
        items = items.filter((m) => m.variantId === query.variantId)
      }
      if (query.locationId) {
        items = items.filter((m) => m.locationId === query.locationId)
      }
      if (query.inventoryItemId) {
        items = items.filter((m) => m.inventoryItemId === query.inventoryItemId)
      }
      if (query.type && query.type !== 'all') {
        items = items.filter((m) => m.type === query.type)
      }
      if (query.correlationId) {
        items = items.filter((m) => m.correlationId === query.correlationId)
      }
      items = items
        .slice()
        .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
        .slice(0, query.limit ?? 50)
      return { items, nextCursor: null }
    },
  }
}
