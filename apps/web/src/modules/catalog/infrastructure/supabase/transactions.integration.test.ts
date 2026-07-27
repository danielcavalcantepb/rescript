// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Product } from '#/modules/catalog/domain/types'
import {
  afterAllCatalogPersistence,
  createCatalogPersistenceFixture,
  isLocalSupabaseAvailable,
  LOCAL_SUPABASE,
  type CatalogPersistenceFixture,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'
import {
  getCatalogSql,
  withCatalogTransaction,
} from '#/modules/catalog/infrastructure/supabase/index.server'

const available = await isLocalSupabaseAvailable()

describe.skipIf(!available)('catalog transaction safety (local)', () => {
  let fx: CatalogPersistenceFixture

  beforeAll(async () => {
    fx = await createCatalogPersistenceFixture('tx')
  }, 60_000)

  afterAll(async () => {
    await fx?.cleanup()
    await afterAllCatalogPersistence()
  }, 60_000)

  function product(name: string, sku: string): Product {
    const productId = crypto.randomUUID()
    const variantId = crypto.randomUUID()
    return {
      id: productId,
      organizationId: fx.organizationId,
      name,
      description: null,
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
          sku: { value: sku },
          barcodes: [],
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
    }
  }

  it('rolls back mid-flight failure leaving no partial product', async () => {
    const p = product('TX Rollback', `TXR-${crypto.randomUUID().slice(0, 6).toUpperCase()}`)
    await expect(
      withCatalogTransaction(
        LOCAL_SUPABASE.databaseUrl,
        fx.organizationId,
        fx.userId,
        async ({ sql, organizationId }) => {
          await sql`
            insert into public.product (
              id, organization_id, name, sku, unit, status, lifecycle_status,
              created_by, updated_by
            ) values (
              ${p.id}::uuid,
              ${organizationId}::uuid,
              ${p.name},
              ${p.variants[0]!.sku!.value},
              'un',
              'active',
              'draft',
              ${fx.userId}::uuid,
              ${fx.userId}::uuid
            )
          `
          throw new Error('forced_mid_transaction_failure')
        },
      ),
    ).rejects.toThrow()

    expect(
      await fx.repos.products.getById(fx.organizationId, p.id),
    ).toBeNull()
  })

  it('SET LOCAL context does not leak across concurrent transactions', async () => {
    const results = await Promise.all([
      withCatalogTransaction(
        LOCAL_SUPABASE.databaseUrl,
        fx.organizationId,
        fx.userId,
        async ({ sql }) => {
          const rows = await sql<{ v: string | null }[]>`
            select current_setting('app.catalog_organization_id', true) as v
          `
          await new Promise((r) => setTimeout(r, 30))
          const again = await sql<{ v: string | null }[]>`
            select current_setting('app.catalog_organization_id', true) as v
          `
          return [rows[0]?.v, again[0]?.v]
        },
      ),
      withCatalogTransaction(
        LOCAL_SUPABASE.databaseUrl,
        crypto.randomUUID(),
        fx.userId,
        async ({ sql, organizationId }) => {
          const rows = await sql<{ v: string | null }[]>`
            select current_setting('app.catalog_organization_id', true) as v
          `
          return [rows[0]?.v, organizationId]
        },
      ),
    ])

    expect(results[0]?.[0]).toBe(fx.organizationId)
    expect(results[0]?.[1]).toBe(fx.organizationId)
    expect(results[1]?.[0]).toBe(results[1]?.[1])
    expect(results[1]?.[0]).not.toBe(fx.organizationId)
  })

  it('constraint failure aborts product aggregate save atomically', async () => {
    const first = product(
      'TX First',
      `TXC-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
    )
    await fx.repos.products.save(first)
    const second = product('TX Second', first.variants[0]!.sku!.value)
    await expect(fx.repos.products.save(second)).rejects.toThrow()
    expect(
      await fx.repos.products.getById(fx.organizationId, second.id),
    ).toBeNull()
  })

  it('pool remains usable after rollback', async () => {
    const sql = getCatalogSql(LOCAL_SUPABASE.databaseUrl)
    try {
      await sql.begin(async (tx) => {
        await tx`select 1`
        throw new Error('rollback_pool_probe')
      })
    } catch {
      // expected
    }
    const rows = await sql<{ n: number }[]>`select 1::int as n`
    expect(rows[0]?.n).toBe(1)
  })
})
