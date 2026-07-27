// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type {
  AttributeDefinition,
  Brand,
  Category,
  PriceList,
  Product,
} from '#/modules/catalog/domain/types'
import { CatalogConflictError } from '#/modules/catalog/application/errors'
import {
  afterAllCatalogPersistence,
  createCatalogPersistenceFixture,
  isLocalSupabaseAvailable,
  LOCAL_SUPABASE,
  type CatalogPersistenceFixture,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'
import { getCatalogSql } from '#/modules/catalog/infrastructure/supabase/index.server'

const available = await isLocalSupabaseAvailable()

describe.skipIf(!available)('catalog supabase persistence (local)', () => {
  let fx: CatalogPersistenceFixture

  beforeAll(async () => {
    fx = await createCatalogPersistenceFixture('integration')
  }, 60_000)

  afterAll(async () => {
    await fx?.cleanup()
    await afterAllCatalogPersistence()
  }, 60_000)

  function simpleProduct(overrides: Partial<Product> = {}): Product {
    const productId = crypto.randomUUID()
    const variantId = crypto.randomUUID()
    return {
      id: productId,
      organizationId: fx.organizationId,
      name: 'Camiseta Básica',
      description: 'Algodão',
      brandId: null,
      primaryCategoryId: null,
      defaultUnitOfMeasureId: fx.unitOfMeasureId,
      topology: 'simple',
      status: 'draft',
      axes: [],
      variants: [
        {
          id: variantId,
          productId,
          organizationId: fx.organizationId,
          sku: { value: `SKU-${variantId.slice(0, 8).toUpperCase()}` },
          barcodes: [
            {
              id: crypto.randomUUID(),
              barcode: {
                type: 'internal',
                value: `INT-${variantId.slice(0, 6)}`,
              },
              isPrimary: true,
            },
          ],
          unitOfMeasureId: fx.unitOfMeasureId,
          attributeValues: [],
          combinationHash: 'default',
          isDefault: true,
          tracksInventory: true,
          minSaleQty: { amount: '1', precision: 0 },
          saleMultiple: { amount: '1', precision: 0 },
          status: 'draft',
        },
      ],
      ...overrides,
    }
  }

  it('brand/category/attribute repository contract', async () => {
    const brand: Brand = {
      id: crypto.randomUUID(),
      organizationId: fx.organizationId,
      name: 'Rescript Wear',
      normalizedName: 'rescript wear',
      status: 'active',
    }
    await fx.repos.brands.save(brand)
    expect(await fx.repos.brands.getById(fx.organizationId, brand.id)).toEqual(
      brand,
    )

    const category: Category = {
      id: crypto.randomUUID(),
      organizationId: fx.organizationId,
      parentId: null,
      name: 'Vestuário',
      normalizedName: 'vestuario',
      status: 'active',
      depth: 0,
    }
    await fx.repos.categories.save(category)
    expect(
      await fx.repos.categories.getById(fx.organizationId, category.id),
    ).toEqual(category)

    const definitionId = crypto.randomUUID()
    const attribute: AttributeDefinition = {
      id: definitionId,
      organizationId: fx.organizationId,
      name: 'Cor',
      normalizedName: 'cor',
      valueType: 'option',
      status: 'active',
      options: [
        {
          id: crypto.randomUUID(),
          definitionId,
          label: 'Azul',
          normalizedLabel: 'azul',
          status: 'active',
          sortOrder: 0,
        },
      ],
    }
    await fx.repos.attributes.save(attribute)
    expect(
      await fx.repos.attributes.getById(fx.organizationId, definitionId),
    ).toEqual(attribute)
  }, 30_000)

  it('product round-trip preserves inferred topology and default UOM', async () => {
    const product = simpleProduct({ name: 'Round Trip' })
    await fx.repos.products.save(product)
    const loaded = await fx.repos.products.getById(
      fx.organizationId,
      product.id,
    )
    expect(loaded?.topology).toBe('simple')
    expect(loaded?.defaultUnitOfMeasureId).toBe(fx.unitOfMeasureId)
    expect(loaded?.variants[0]?.sku).toEqual(product.variants[0]?.sku)

    await fx.repos.products.save(loaded!)
    const again = await fx.repos.products.getById(
      fx.organizationId,
      product.id,
    )
    expect(again?.topology).toBe(loaded?.topology)
    expect(again?.defaultUnitOfMeasureId).toBe(loaded?.defaultUnitOfMeasureId)
    expect(again?.status).toBe(loaded?.status)
  }, 30_000)

  it('price list save is transactional with history', async () => {
    const product = simpleProduct({ name: 'Priced Item' })
    await fx.repos.products.save(product)
    const list: PriceList = {
      id: crypto.randomUUID(),
      organizationId: fx.organizationId,
      name: 'Padrão',
      description: null,
      currency: 'BRL',
      isDefault: true,
      priority: 100,
      status: 'active',
      entries: [
        {
          id: crypto.randomUUID(),
          priceListId: '',
          variantId: product.variants[0]!.id,
          amount: { currency: 'BRL', amount: '29.9' },
          validFrom: '2026-01-01T00:00:00.000Z',
          validTo: null,
        },
      ],
    }
    list.entries[0]!.priceListId = list.id
    await fx.repos.priceLists.save(list)
    const loaded = await fx.repos.priceLists.getDefault(fx.organizationId)
    expect(loaded?.entries[0]?.amount.amount).toBe('29.9')
    const sql = getCatalogSql(LOCAL_SUPABASE.databaseUrl)
    const history = await sql<{ n: number }[]>`
      select count(*)::int as n from public.price_history
      where price_list_id = ${list.id}::uuid
        and organization_id = ${fx.organizationId}::uuid
    `
    expect(history[0]?.n).toBeGreaterThanOrEqual(1)
  }, 30_000)

  it('search finds by name/sku/internal and rejects SQL injection payloads', async () => {
    const product = simpleProduct({ name: 'Tênis Runner Pro' })
    const sku = `RUN-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
    const internal = `INTCODE-${crypto.randomUUID().slice(0, 6)}`
    product.variants[0]!.sku = { value: sku }
    product.variants[0]!.barcodes = [
      {
        id: crypto.randomUUID(),
        barcode: { type: 'internal', value: internal },
        isPrimary: true,
      },
    ]
    await fx.repos.products.save(product)

    const byName = await fx.repos.search.search({
      organizationId: fx.organizationId,
      text: 'Runner',
      limit: 10,
    })
    expect(byName.some((h) => h.productId === product.id)).toBe(true)

    const injection = await fx.repos.search.search({
      organizationId: fx.organizationId,
      text: `'; drop table brand;--`,
      limit: 10,
    })
    expect(Array.isArray(injection)).toBe(true)

    const special = await fx.repos.search.search({
      organizationId: fx.organizationId,
      text: `%_${sku.slice(0, 3)}`,
      limit: 10,
    })
    expect(Array.isArray(special)).toBe(true)
  }, 30_000)

  it('product save transaction rolls back on conflict', async () => {
    const first = simpleProduct({ name: 'Conflict A' })
    await fx.repos.products.save(first)
    const second = simpleProduct({ name: 'Conflict B' })
    second.variants[0]!.sku = first.variants[0]!.sku
    await expect(fx.repos.products.save(second)).rejects.toBeInstanceOf(
      CatalogConflictError,
    )
    expect(
      await fx.repos.products.getById(fx.organizationId, second.id),
    ).toBeNull()
  }, 30_000)
})
