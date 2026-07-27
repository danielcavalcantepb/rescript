// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Brand, Product } from '#/modules/catalog/domain/types'
import type {
  BrandRepository,
  CatalogProductRepository,
} from '#/modules/catalog/application/ports/repositories'
import { createInMemoryCatalogRepos } from '#/modules/catalog/infrastructure/memory/in-memory-repositories'
import {
  afterAllCatalogPersistence,
  createCatalogPersistenceFixture,
  isLocalSupabaseAvailable,
  type CatalogPersistenceFixture,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'

const available = await isLocalSupabaseAvailable()

type BrandProductPorts = {
  brands: BrandRepository
  products: CatalogProductRepository
  organizationId: string
  unitOfMeasureId: string
}

function runBrandProductContract(
  label: string,
  setup: () => Promise<BrandProductPorts & { cleanup?: () => Promise<void> }>,
) {
  describe(`catalog repository contract — ${label}`, () => {
    let ports: BrandProductPorts & { cleanup?: () => Promise<void> }

    beforeAll(async () => {
      ports = await setup()
    }, 60_000)

    afterAll(async () => {
      await ports?.cleanup?.()
    }, 60_000)

    it('creates, lists, updates and finds brand', async () => {
      const brand: Brand = {
        id: crypto.randomUUID(),
        organizationId: ports.organizationId,
        name: `Brand ${label}`,
        normalizedName: `brand ${label}`,
        status: 'active',
      }
      await ports.brands.save(brand)
      expect(
        await ports.brands.getById(ports.organizationId, brand.id),
      ).toEqual(brand)
      expect(
        await ports.brands.findByNormalizedName(
          ports.organizationId,
          brand.normalizedName,
        ),
      ).toEqual(brand)

      const renamed = { ...brand, name: `Brand ${label} 2`, normalizedName: `brand ${label} 2` }
      await ports.brands.save(renamed)
      expect(
        (await ports.brands.getById(ports.organizationId, brand.id))?.name,
      ).toBe(renamed.name)

      const listed = await ports.brands.listByOrganization(ports.organizationId)
      expect(listed.some((b) => b.id === brand.id)).toBe(true)
    }, 30_000)

    it('saves and reconstructs product aggregate', async () => {
      const productId = crypto.randomUUID()
      const variantId = crypto.randomUUID()
      const product: Product = {
        id: productId,
        organizationId: ports.organizationId,
        name: `Product ${label}`,
        description: null,
        brandId: null,
        primaryCategoryId: null,
        defaultUnitOfMeasureId: ports.unitOfMeasureId,
        topology: 'simple',
        status: 'draft',
        axes: [],
        variants: [
          {
            id: variantId,
            productId,
            organizationId: ports.organizationId,
            sku: {
              value: `C-${label.slice(0, 3).toUpperCase()}-${variantId.slice(0, 6).toUpperCase()}`,
            },
            barcodes: [],
            unitOfMeasureId: ports.unitOfMeasureId,
            attributeValues: [],
            combinationHash: 'default',
            isDefault: true,
            tracksInventory: true,
            minSaleQty: { amount: '1', precision: 0 },
            saleMultiple: { amount: '1', precision: 0 },
            status: 'draft',
          },
        ],
      }
      await ports.products.save(product)
      const loaded = await ports.products.getById(
        ports.organizationId,
        product.id,
      )
      expect(loaded?.name).toBe(product.name)
      expect(loaded?.topology).toBe('simple')
      expect(loaded?.variants).toHaveLength(1)
      expect(await ports.products.listSkus(ports.organizationId)).toContain(
        product.variants[0]!.sku!.value,
      )
      expect(
        await ports.products.getById(ports.organizationId, crypto.randomUUID()),
      ).toBeNull()
    }, 30_000)
  })
}

runBrandProductContract('in-memory', async () => {
  const orgId = crypto.randomUUID()
  const repos = createInMemoryCatalogRepos()
  return {
    brands: repos.brands,
    products: repos.products,
    organizationId: orgId,
    unitOfMeasureId: crypto.randomUUID(),
  }
})

describe.skipIf(!available)('catalog repository contract — supabase', () => {
  let fx: CatalogPersistenceFixture

  beforeAll(async () => {
    fx = await createCatalogPersistenceFixture('contract')
  }, 60_000)

  afterAll(async () => {
    await fx?.cleanup()
    await afterAllCatalogPersistence()
  }, 60_000)

  runBrandProductContract('supabase-inner', async () => ({
    brands: fx.repos.brands,
    products: fx.repos.products,
    organizationId: fx.organizationId,
    unitOfMeasureId: fx.unitOfMeasureId,
    cleanup: async () => undefined,
  }))
})
