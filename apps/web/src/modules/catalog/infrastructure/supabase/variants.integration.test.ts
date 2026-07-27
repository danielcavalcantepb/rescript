// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { createCatalogApplicationService } from '#/modules/catalog/application'
import { createInMemoryEventCollector } from '#/modules/catalog/application/ports/event-collector'
import {
  CatalogDomainRuleError,
  CatalogNotFoundError,
} from '#/modules/catalog/application/errors'
import {
  afterAllCatalogPersistence,
  createCatalogPersistenceFixture,
  isLocalSupabaseAvailable,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'

const available = await isLocalSupabaseAvailable()
const uuidIds = { next: () => crypto.randomUUID() }

describe.skipIf(!available)('catalog variants matrix (local Supabase)', () => {
  afterAll(async () => {
    await afterAllCatalogPersistence()
  })

  it(
    'applies axes, preserves SKUs, archives/restores and isolates tenants',
    async () => {
    const orgA = await createCatalogPersistenceFixture('var-a')
    const orgB = await createCatalogPersistenceFixture('var-b')
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
        name: 'Bolsa Multi',
        sku: `BAG-${crypto.randomUUID().slice(0, 8)}`,
        unitOfMeasureId: orgA.unitOfMeasureId,
      })

      const preview = await appA.previewVariantCombinations({
        productId: created.id,
        axes: [
          { name: 'Cor', options: ['Preto', 'Bege'] },
          { name: 'Modelo', options: ['Tote', 'Cross'] },
        ],
      })
      expect(preview.totalCombinations).toBe(4)

      const applied = await appA.applyVariantCombinations({
        productId: created.id,
        axes: [
          { name: 'Cor', options: ['Preto', 'Bege'] },
          { name: 'Modelo', options: ['Tote', 'Cross'] },
        ],
        createSelectionKeys: preview.items
          .filter((i) => i.state === 'new')
          .map((i) => i.selectionKey),
        skuPrefix: 'BAG',
      })
      expect(applied.createdVariantIds).toHaveLength(4)

      const { data: projection, error: projectionError } = await orgA.client
        .from('catalog_search_projection')
        .select('variant_id, product_name, attributes')
        .eq('organization_id', orgA.organizationId)
        .eq('product_id', created.id)
      expect(projectionError).toBeNull()
      expect(projection?.length).toBeGreaterThanOrEqual(4)
      expect(projection?.every((row) => row.product_name === 'Bolsa Multi')).toBe(
        true,
      )
      expect(
        projection?.filter(
          (row) =>
            Array.isArray(row.attributes) && row.attributes.length === 2,
        ),
      ).toHaveLength(4)

      const listed = await appA.getProductVariants({
        productId: created.id,
        status: 'draft',
      })
      expect(listed.items.length).toBeGreaterThanOrEqual(4)

      const target = listed.items[0]!
      const customSku = `BAG-CUSTOM-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
      const updated = await appA.updateVariant({
        productId: created.id,
        variantId: target.id,
        sku: customSku,
      })
      expect(updated.sku).toBe(customSku)

      // Re-apply same matrix — must preserve custom SKU
      const reapplied = await appA.applyVariantCombinations({
        productId: created.id,
        axes: [
          { name: 'Cor', options: ['Preto', 'Bege'] },
          { name: 'Modelo', options: ['Tote', 'Cross'] },
        ],
        createSelectionKeys: [],
      })
      const preserved = reapplied.product.variants.find((v) => v.id === target.id)
      expect(preserved?.sku).toBe(customSku)

      await appA.archiveVariant({
        productId: created.id,
        variantId: target.id,
      })
      const restored = await appA.restoreVariant({
        productId: created.id,
        variantId: target.id,
      })
      expect(restored.status).toBe('draft')

      await expect(appB.getProductVariants({ productId: created.id })).rejects.toBeInstanceOf(
        CatalogNotFoundError,
      )
      await expect(
        appB.archiveVariant({
          productId: created.id,
          variantId: target.id,
        }),
      ).rejects.toBeInstanceOf(CatalogNotFoundError)

      // Duplicate SKU in same org
      const other = listed.items.find((v) => v.id !== target.id)!
      await expect(
        appA.updateVariant({
          productId: created.id,
          variantId: other.id,
          sku: customSku,
        }),
      ).rejects.toBeInstanceOf(CatalogDomainRuleError)
    } finally {
      await orgA.cleanup()
      await orgB.cleanup()
    }
  },
    30_000,
  )
})
