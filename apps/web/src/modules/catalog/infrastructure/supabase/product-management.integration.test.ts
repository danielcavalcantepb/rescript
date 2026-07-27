// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { createCatalogApplicationService } from '#/modules/catalog/application'
import { createInMemoryEventCollector } from '#/modules/catalog/application/ports/event-collector'
import {
  CatalogDomainRuleError,
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

describe.skipIf(!available)(
  'catalog product management (local Supabase)',
  () => {
    afterAll(async () => {
      await afterAllCatalogPersistence()
    })

    it('creates, reads, updates product and blocks cross-tenant access', async () => {
      const orgA = await createCatalogPersistenceFixture('pm-a')
      const orgB = await createCatalogPersistenceFixture('pm-b')
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
          name: 'Produto PM',
          sku: `PM-${crypto.randomUUID().slice(0, 8)}`,
          unitOfMeasureId: orgA.unitOfMeasureId,
          description: 'inicial',
        })
        const detail = await appA.getProductDetail(created.id)
        expect(detail.name).toBe('Produto PM')
        expect(detail.defaultUnitOfMeasureId).toBe(orgA.unitOfMeasureId)

        const updated = await appA.updateProduct({
          productId: created.id,
          name: 'Produto PM Atualizado',
          description: 'atualizado',
        })
        expect(updated.name).toBe('Produto PM Atualizado')

        const again = await appA.getProductDetail(created.id)
        expect(again.description).toBe('atualizado')
        expect(again.variants).toHaveLength(1)

        await expect(appB.getProductDetail(created.id)).rejects.toBeInstanceOf(
          CatalogNotFoundError,
        )
        await expect(
          appB.updateProduct({
            productId: created.id,
            name: 'Hijack',
          }),
        ).rejects.toBeInstanceOf(CatalogNotFoundError)

        await expect(
          appA.createProduct({
            name: 'Dup',
            sku: created.variants[0]!.sku!,
            unitOfMeasureId: orgA.unitOfMeasureId,
          }),
        ).rejects.toBeInstanceOf(CatalogDomainRuleError)
      } finally {
        await orgA.cleanup()
        await orgB.cleanup()
      }
    })

    it('denies write when can() is false', async () => {
      const fx = await createCatalogPersistenceFixture('pm-perm')
      try {
        const app = createCatalogApplicationService({
          organizationId: fx.organizationId,
          userId: fx.userId,
          can: () => false,
          ids: uuidIds,
          clock: { nowIso: () => new Date().toISOString() },
          events: createInMemoryEventCollector(),
          products: fx.repos.products,
          brands: fx.repos.brands,
          categories: fx.repos.categories,
          priceLists: fx.repos.priceLists,
          attributes: fx.repos.attributes,
          units: fx.repos.units,
          lifecycleAudit: fx.repos.lifecycleAudit,
          priceHistory: fx.repos.priceHistory,
        })
        await expect(
          app.createProduct({
            name: 'No',
            sku: 'NO-1',
            unitOfMeasureId: fx.unitOfMeasureId,
          }),
        ).rejects.toBeInstanceOf(CatalogPermissionError)
      } finally {
        await fx.cleanup()
      }
    })
  },
)
