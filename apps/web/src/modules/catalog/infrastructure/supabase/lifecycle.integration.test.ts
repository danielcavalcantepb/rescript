// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { createCatalogApplicationService } from '#/modules/catalog/application'
import { createInMemoryEventCollector } from '#/modules/catalog/application/ports/event-collector'
import {
  CatalogNotFoundError,
  CatalogPermissionError,
} from '#/modules/catalog/application/errors'
import {
  afterAllCatalogPersistence,
  createCatalogPersistenceFixture,
  isLocalSupabaseAvailable,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'

const available = await isLocalSupabaseAvailable()
const uuidIds = { next: () => crypto.randomUUID() }

describe.skipIf(!available)('catalog product lifecycle (local Supabase)', () => {
  afterAll(async () => {
    await afterAllCatalogPersistence()
  })

  it('archives, restores, audits and isolates tenants', async () => {
    const orgA = await createCatalogPersistenceFixture('life-a')
    const orgB = await createCatalogPersistenceFixture('life-b')
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

      const created = await appA.createProduct({
        name: 'Lifecycle Item',
        sku: `LIFE-${crypto.randomUUID().slice(0, 8)}`,
        unitOfMeasureId: orgA.unitOfMeasureId,
      })
      const list = await appA.createPriceList({ name: 'Default', isDefault: true })
      await appA.addPriceEntry({
        priceListId: list.id,
        variantId: created.variants[0]!.id,
        amount: '9.90',
        validFrom: '2026-01-01T00:00:00.000Z',
      })

      const published = await appA.publishProduct({
        productId: created.id,
        reason: 'pronto para venda',
      })
      expect(published.status).toBe('active')

      const archived = await appA.archiveProduct({ productId: created.id })
      expect(archived.status).toBe('archived')

      await expect(
        appA.publishProduct({ productId: created.id }),
      ).rejects.toBeInstanceOf(CatalogPermissionError)

      const restored = await appA.restoreProduct({ productId: created.id })
      expect(restored.status).toBe('draft')

      const lifecycle = await appA.getLifecycle(created.id)
      expect(lifecycle.history.length).toBeGreaterThanOrEqual(3)
      expect(lifecycle.history.some((h) => h.action === 'publish')).toBe(true)

      await expect(appB.getLifecycle(created.id)).rejects.toBeInstanceOf(
        CatalogNotFoundError,
      )
      await expect(
        appB.archiveProduct({ productId: created.id }),
      ).rejects.toBeInstanceOf(CatalogNotFoundError)

      const listedActive = await appA.listProducts({ status: 'active' })
      expect(listedActive.items.find((i) => i.id === created.id)).toBeUndefined()
      const listedDraft = await appA.listProducts({ status: 'draft' })
      expect(listedDraft.items.some((i) => i.id === created.id)).toBe(true)
    } finally {
      await orgA.cleanup()
      await orgB.cleanup()
    }
  })
})
