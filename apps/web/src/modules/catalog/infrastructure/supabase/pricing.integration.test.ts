// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { createCatalogApplicationService } from '#/modules/catalog/application'
import { createInMemoryEventCollector } from '#/modules/catalog/application/ports/event-collector'
import { CatalogNotFoundError } from '#/modules/catalog/application/errors'
import {
  afterAllCatalogPersistence,
  createCatalogPersistenceFixture,
  isLocalSupabaseAvailable,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'

const available = await isLocalSupabaseAvailable()
const uuidIds = { next: () => crypto.randomUUID() }

describe.skipIf(!available)('catalog price engine (local Supabase)', () => {
  afterAll(async () => {
    await afterAllCatalogPersistence()
  })

  it('persists priority, resolves, audits history and isolates tenants', async () => {
    const orgA = await createCatalogPersistenceFixture('price-a')
    const orgB = await createCatalogPersistenceFixture('price-b')
    try {
      const appA = createCatalogApplicationService({
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
      const appB = createCatalogApplicationService({
        organizationId: orgB.organizationId,
        userId: orgB.userId,
        can: () => true,
        ids: uuidIds,
        clock: { nowIso: () => new Date().toISOString() },
        events: createInMemoryEventCollector(),
        products: orgB.repos.products,
        brands: orgB.repos.brands,
        categories: orgB.repos.categories,
        priceLists: orgB.repos.priceLists,
        attributes: orgB.repos.attributes,
        units: orgB.repos.units,
        lifecycleAudit: orgB.repos.lifecycleAudit,
        priceHistory: orgB.repos.priceHistory,
      })

      const product = await appA.createProduct({
        name: 'Item Price',
        sku: `PRC-${crypto.randomUUID().slice(0, 8)}`,
        unitOfMeasureId: orgA.unitOfMeasureId,
      })
      const variantId = product.variants[0]!.id
      const list = await appA.createPriceList({
        name: 'Varejo',
        isDefault: true,
        priority: 40,
        description: 'Lista principal',
      })
      expect(list.priority).toBe(40)

      await appA.addPriceEntry({
        priceListId: list.id,
        variantId,
        amount: '55.5',
        validFrom: '2026-01-01T00:00:00.000Z',
      })

      const resolved = await appA.resolveCurrentPrice({
        variantId,
        at: '2026-07-01T00:00:00.000Z',
      })
      expect(resolved.amount).toBe('55.5')
      expect(resolved.priceListName).toBe('Varejo')

      const history = await appA.listPriceHistory({ variantId, limit: 10 })
      expect(history.length).toBeGreaterThanOrEqual(1)

      const detail = await appA.getPriceList(list.id)
      expect(detail.description).toBe('Lista principal')
      expect(detail.entries).toHaveLength(1)

      await expect(appB.getPriceList(list.id)).rejects.toBeInstanceOf(
        CatalogNotFoundError,
      )
      await expect(
        appB.resolveCurrentPrice({
          variantId,
          at: '2026-07-01T00:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(CatalogNotFoundError)
    } finally {
      await orgA.cleanup()
      await orgB.cleanup()
    }
  })
})
