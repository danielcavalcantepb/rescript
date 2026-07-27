// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { createCatalogApplicationService } from '#/modules/catalog/application'
import { createInMemoryEventCollector } from '#/modules/catalog/application/ports/event-collector'
import {
  afterAllCatalogPersistence,
  createCatalogPersistenceFixture,
  isLocalSupabaseAvailable,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'
import { createInventoryFoundationService } from '#/modules/inventory/application/foundation/inventory-foundation-service'
import { createInMemoryInventoryEventCollector } from '#/modules/inventory/domain/foundation/events'
import { createSupabaseInventoryFoundationRepos } from '#/modules/inventory/infrastructure/foundation/create-supabase-inventory-foundation-repos'

const available = await isLocalSupabaseAvailable()
const uuidIds = { next: () => crypto.randomUUID() }

describe.skipIf(!available)('inventory ledger (local Supabase)', () => {
  afterAll(async () => {
    await afterAllCatalogPersistence()
  })

  it('registers entry/transfer/reverse with idempotency and tenant isolation', async () => {
    const orgA = await createCatalogPersistenceFixture('led-a')
    const orgB = await createCatalogPersistenceFixture('led-b')
    try {
      const catalogA = createCatalogApplicationService({
        organizationId: orgA.organizationId,
        userId: orgA.userId,
        can: () => true,
        ids: uuidIds,
        clock: { nowIso: () => new Date().toISOString() },
        events: createInMemoryEventCollector(),
        products: orgA.repos.products,
        brands: orgA.repos.brands,
        categories: orgA.repos.categories,
        priceLists: orgA.repos.priceLists,
        attributes: orgA.repos.attributes,
        units: orgA.repos.units,
        lifecycleAudit: orgA.repos.lifecycleAudit,
        priceHistory: orgA.repos.priceHistory,
      })

      const product = await catalogA.createProduct({
        name: 'Ledger Item',
        sku: `LED-${crypto.randomUUID().slice(0, 8)}`,
        unitOfMeasureId: orgA.unitOfMeasureId,
      })
      const variantId = product.variants[0]!.id
      const list = await catalogA.createPriceList({
        name: 'Padrão',
        isDefault: true,
      })
      await catalogA.addPriceEntry({
        priceListId: list.id,
        variantId,
        amount: '10.00',
        validFrom: '2026-01-01T00:00:00.000Z',
      })
      await catalogA.activateProduct({ productId: product.id })

      const reposA = await createSupabaseInventoryFoundationRepos({
        client: orgA.client,
        actorUserId: orgA.userId,
        organizationId: orgA.organizationId,
      })
      const reposB = await createSupabaseInventoryFoundationRepos({
        client: orgB.client,
        actorUserId: orgB.userId,
        organizationId: orgB.organizationId,
      })

      const appA = createInventoryFoundationService({
        organizationId: reposA.organizationId,
        userId: reposA.actorUserId,
        can: () => true,
        ids: uuidIds,
        clock: { nowIso: () => new Date().toISOString() },
        events: createInMemoryInventoryEventCollector(),
        locations: reposA.locations,
        items: reposA.items,
        history: reposA.history,
        variantLookup: reposA.variantLookup,
        ledger: reposA.ledger,
      })
      const appB = createInventoryFoundationService({
        organizationId: reposB.organizationId,
        userId: reposB.actorUserId,
        can: () => true,
        ids: uuidIds,
        clock: { nowIso: () => new Date().toISOString() },
        events: createInMemoryInventoryEventCollector(),
        locations: reposB.locations,
        items: reposB.items,
        history: reposB.history,
        variantLookup: reposB.variantLookup,
        ledger: reposB.ledger,
      })

      const main = await appA.createLocation({
        code: 'MAIN',
        name: 'Principal',
        isDefault: true,
      })
      const sec = await appA.createLocation({
        code: 'SEC',
        name: 'Secundário',
      })

      const entry = await appA.createEntry({
        variantId,
        locationId: main.id,
        quantity: 15,
        reason: 'abertura',
        idempotencyKey: `entry-${variantId}`,
      })
      expect(entry.projection.quantityOnHand).toBe(15)

      const entryAgain = await appA.createEntry({
        variantId,
        locationId: main.id,
        quantity: 15,
        reason: 'abertura',
        idempotencyKey: `entry-${variantId}`,
      })
      expect(entryAgain.movement.id).toBe(entry.movement.id)

      const xfer = await appA.createTransfer({
        variantId,
        fromLocationId: main.id,
        toLocationId: sec.id,
        quantity: 5,
        reason: 'transfer',
        idempotencyKey: `xfer-${variantId}`,
      })
      expect(xfer.related).toHaveLength(2)
      expect(xfer.projection.quantityOnHand).toBe(10)

      const reversed = await appA.reverseMovement({
        movementId: xfer.movement.id,
        reason: 'estorno',
      })
      expect(reversed.movement.type).toBe('reversal')
      expect(reversed.projection.quantityOnHand).toBe(15)

      await expect(
        appB.listMovements({ variantId }),
      ).resolves.toEqual([])
      await expect(appB.getMovement(entry.movement.id)).rejects.toThrow()
    } finally {
      await orgA.cleanup()
      await orgB.cleanup()
    }
  })
})
