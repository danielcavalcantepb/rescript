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

function app() {
  const grants = permissionsForRole('manager')
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
  const clock = { nowIso: () => new Date().toISOString() }
  const deps = {
    organizationId: 'org-1',
    userId: 'user-1',
    can: (key: Parameters<typeof can>[1]) => can(grants, key),
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
  return createInventoryFoundationService(deps)
}

describe('Inventory Ledger application', () => {
  it('projects balance from entry/exit/adjustment', async () => {
    const service = app()
    const loc = await service.createLocation({
      code: 'MAIN',
      name: 'Principal',
      isDefault: true,
    })
    await service.createEntry({
      variantId: 'var-1',
      locationId: loc.id,
      quantity: 20,
      reason: 'in',
    })
    await service.createExit({
      variantId: 'var-1',
      locationId: loc.id,
      quantity: 5,
      reason: 'out',
    })
    await service.createAdjustment({
      variantId: 'var-1',
      locationId: loc.id,
      quantity: 2,
      direction: 'in',
      reason: 'count',
    })
    const summary = await service.getVariantInventorySummary('var-1')
    expect(summary.item?.quantityOnHand).toBe(17)
    const history = await service.listMovements({ variantId: 'var-1' })
    expect(history.length).toBe(3)
  })

  it('is idempotent under duplicate keys', async () => {
    const service = app()
    const loc = await service.createLocation({
      code: 'MAIN',
      name: 'Principal',
      isDefault: true,
    })
    const a = await service.createEntry({
      variantId: 'var-1',
      locationId: loc.id,
      quantity: 3,
      reason: 'in',
      idempotencyKey: 'k1',
    })
    const b = await service.createEntry({
      variantId: 'var-1',
      locationId: loc.id,
      quantity: 3,
      reason: 'in',
      idempotencyKey: 'k1',
    })
    expect(a.movement.id).toBe(b.movement.id)
    expect(b.projection.quantityOnHand).toBe(3)
  })
})
