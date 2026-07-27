import { describe, expect, it } from 'vitest'
import { can, permissionsForRole } from '@rescript/permissions'
import { createInventoryFoundationService } from '#/modules/inventory/application/foundation/inventory-foundation-service'
import { createInMemoryInventoryHistory } from '#/modules/inventory/application/foundation/ports'
import { createInMemoryInventoryLedger } from '#/modules/inventory/application/foundation/memory-ledger'
import {
  createInMemoryInventoryItemRepository,
  createInMemoryStockLocationRepository,
  createInMemoryVariantLookup,
} from '#/modules/inventory/application/foundation/memory-repos'
import { createInMemoryInventoryEventCollector } from '#/modules/inventory/domain/foundation/events'
import type { InventoryFoundationDeps } from '#/modules/inventory/application/foundation/deps'

function harness(
  role: 'manager' | 'viewer' | 'inventory' = 'manager',
): InventoryFoundationDeps & {
  app: ReturnType<typeof createInventoryFoundationService>
} {
  const grants = permissionsForRole(role)
  const locations = createInMemoryStockLocationRepository()
  const items = createInMemoryInventoryItemRepository()
  const variantLookup = createInMemoryVariantLookup([
    {
      variantId: 'var-1',
      productId: 'prod-1',
      organizationId: 'org-1',
      variantStatus: 'active',
      productStatus: 'active',
      unitOfMeasureId: 'uom-1',
      sku: 'SKU-1',
      tracksInventory: true,
    },
  ])
  const ids = { next: () => crypto.randomUUID() }
  const clock = { nowIso: () => '2026-07-25T12:00:00.000Z' }
  const deps: InventoryFoundationDeps = {
    organizationId: 'org-1',
    userId: 'user-1',
    can: (key) => can(grants, key),
    ids,
    clock,
    events: createInMemoryInventoryEventCollector(),
    locations,
    items,
    history: createInMemoryInventoryHistory(),
    variantLookup,
    ledger: createInMemoryInventoryLedger({
      locations,
      items,
      variantLookup,
      ids,
      clock,
      userId: 'user-1',
    }),
  }
  return { ...deps, app: createInventoryFoundationService(deps) }
}

describe('Inventory Foundation application', () => {
  it('creates location/item at 0 and stocks via ledger entry', async () => {
    const { app, events } = harness('manager')
    const location = await app.createLocation({
      code: 'main',
      name: 'Principal',
      isDefault: true,
    })
    const item = await app.createInventoryItem({
      variantId: 'var-1',
      locationId: location.id,
    })
    expect(item.quantityOnHand).toBe(0)

    await expect(
      app.createInventoryItem({
        variantId: 'var-1',
        locationId: location.id,
        quantityOnHand: 12,
      }),
    ).rejects.toThrow(/quantity_via_ledger_only|inventory_item_exists/)

    const entry = await app.createEntry({
      variantId: 'var-1',
      locationId: location.id,
      quantity: 12,
      reason: 'seed',
      idempotencyKey: 'entry-1',
    })
    expect(entry.projection.quantityOnHand).toBe(12)

    const again = await app.createEntry({
      variantId: 'var-1',
      locationId: location.id,
      quantity: 12,
      reason: 'seed',
      idempotencyKey: 'entry-1',
    })
    expect(again.movement.id).toBe(entry.movement.id)
    expect(again.projection.quantityOnHand).toBe(12)

    const availability = await app.getAvailability({ variantId: 'var-1' })
    expect(availability.quantityOnHand).toBe(12)

    const drained = events.drain()
    expect(drained.some((e) => e.type === 'InventoryMovementCreated')).toBe(
      true,
    )
    expect(drained.some((e) => e.type === 'BalanceProjected')).toBe(true)
  })

  it('rejects direct quantity update', async () => {
    const { app } = harness('manager')
    const location = await app.createLocation({
      code: 'A',
      name: 'A',
      isDefault: true,
    })
    const item = await app.createInventoryItem({
      variantId: 'var-1',
      locationId: location.id,
    })
    await expect(
      app.updateInventoryItem({
        inventoryItemId: item.id,
        quantityOnHand: 5,
      }),
    ).rejects.toThrow(/quantity_via_ledger_only/)
  })

  it('transfers atomically and reverses', async () => {
    const { app } = harness('inventory')
    const main = await app.createLocation({
      code: 'MAIN',
      name: 'Principal',
      isDefault: true,
    })
    const secondary = await app.createLocation({
      code: 'SEC',
      name: 'Secundário',
      isDefault: false,
    })
    await app.createEntry({
      variantId: 'var-1',
      locationId: main.id,
      quantity: 10,
      reason: 'in',
    })
    const xfer = await app.createTransfer({
      variantId: 'var-1',
      fromLocationId: main.id,
      toLocationId: secondary.id,
      quantity: 4,
      reason: 'xfer',
      idempotencyKey: 'xfer-1',
    })
    expect(xfer.related).toHaveLength(2)
    expect(xfer.projection.quantityOnHand).toBe(6)

    const reversed = await app.reverseMovement({
      movementId: xfer.movement.id,
      reason: 'undo out',
    })
    expect(reversed.movement.type).toBe('reversal')
    expect(reversed.projection.quantityOnHand).toBe(10)
  })

  it('blocks insufficient stock and viewer writes', async () => {
    const { app } = harness('manager')
    const location = await app.createLocation({
      code: 'MAIN',
      name: 'Principal',
      isDefault: true,
    })
    await expect(
      app.createExit({
        variantId: 'var-1',
        locationId: location.id,
        quantity: 1,
        reason: 'out',
      }),
    ).rejects.toThrow(/insufficient_stock/)

    const viewer = harness('viewer')
    await expect(
      viewer.app.createLocation({ code: 'X', name: 'X' }),
    ).rejects.toThrow(/permission/i)
  })
})
