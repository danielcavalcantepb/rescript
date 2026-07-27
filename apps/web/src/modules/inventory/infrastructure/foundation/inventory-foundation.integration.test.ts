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
import { InventoryFoundationNotFoundError } from '#/modules/inventory/application/foundation/errors'

const available = await isLocalSupabaseAvailable()
const uuidIds = { next: () => crypto.randomUUID() }

describe.skipIf(!available)(
  'inventory foundation (local Supabase)',
  () => {
    afterAll(async () => {
      await afterAllCatalogPersistence()
    })

    it('persists location/item via ledger projection and isolates tenants', async () => {
      const orgA = await createCatalogPersistenceFixture('inv-a')
      const orgB = await createCatalogPersistenceFixture('inv-b')
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
          name: 'Item Inv',
          sku: `INV-${crypto.randomUUID().slice(0, 8)}`,
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

        const location = await appA.createLocation({
          code: 'MAIN',
          name: 'Principal',
          isDefault: true,
          priority: 100,
        })

        const item = await appA.createInventoryItem({
          variantId,
          locationId: location.id,
        })
        expect(item.quantityOnHand).toBe(0)

        const entry = await appA.createEntry({
          variantId,
          locationId: location.id,
          quantity: 8,
          reason: 'seed',
        })
        expect(entry.projection.quantityOnHand).toBe(8)

        const availability = await appA.getAvailability({ variantId })
        expect(availability.available).toBe(true)
        expect(availability.quantityOnHand).toBe(8)

        await expect(appB.getLocation(location.id)).rejects.toBeInstanceOf(
          InventoryFoundationNotFoundError,
        )
      } finally {
        await orgA.cleanup()
        await orgB.cleanup()
      }
    })
  },
)
