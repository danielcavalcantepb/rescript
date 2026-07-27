// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Brand, Product } from '#/modules/catalog/domain/types'
import { CatalogPermissionError } from '#/modules/catalog/application/errors'
import {
  afterAllCatalogPersistence,
  createAnonClient,
  createCatalogPersistenceFixture,
  isLocalSupabaseAvailable,
  LOCAL_SUPABASE,
  TEST_PASSWORD,
  type CatalogPersistenceFixture,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'
import {
  createSupabaseCatalogRepos,
  getCatalogSql,
  probeSqlSecurityContext,
} from '#/modules/catalog/infrastructure/supabase/index.server'

const available = await isLocalSupabaseAvailable()

describe.skipIf(!available)('catalog multi-tenant isolation (local)', () => {
  let orgA: CatalogPersistenceFixture
  let orgB: CatalogPersistenceFixture
  let brandA: Brand
  let productA: Product

  beforeAll(async () => {
    orgA = await createCatalogPersistenceFixture('org-a')
    orgB = await createCatalogPersistenceFixture('org-b')

    brandA = {
      id: crypto.randomUUID(),
      organizationId: orgA.organizationId,
      name: 'Brand A Only',
      normalizedName: 'brand a only',
      status: 'active',
    }
    await orgA.repos.brands.save(brandA)

    const productId = crypto.randomUUID()
    const variantId = crypto.randomUUID()
    productA = {
      id: productId,
      organizationId: orgA.organizationId,
      name: 'Secret Product A',
      description: null,
      brandId: brandA.id,
      primaryCategoryId: null,
      defaultUnitOfMeasureId: orgA.unitOfMeasureId,
      topology: 'simple',
      status: 'draft',
      axes: [],
      variants: [
        {
          id: variantId,
          productId,
          organizationId: orgA.organizationId,
          sku: { value: `A-${variantId.slice(0, 8).toUpperCase()}` },
          barcodes: [
            {
              id: crypto.randomUUID(),
              barcode: { type: 'internal', value: `AINT-${variantId.slice(0, 6)}` },
              isPrimary: true,
            },
          ],
          unitOfMeasureId: orgA.unitOfMeasureId,
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
    await orgA.repos.products.save(productA)
  }, 90_000)

  afterAll(async () => {
    await orgA?.cleanup()
    await orgB?.cleanup()
    await afterAllCatalogPersistence()
  }, 60_000)

  it('documents SQL direct security context (RLS not forced)', async () => {
    const probe = await probeSqlSecurityContext(LOCAL_SUPABASE.databaseUrl)
    expect(probe.currentUser.length).toBeGreaterThan(0)
    // Local Supabase connects as owner — FORCE RLS is false on brand.
    expect(probe.rowSecurityForced).toBe(false)
  })

  it('user A reads own org; user B cannot read A by id (client RLS)', async () => {
    const aBrand = await orgA.repos.brands.getById(
      orgA.organizationId,
      brandA.id,
    )
    expect(aBrand?.name).toBe('Brand A Only')

    const bSees = await orgB.repos.brands.getById(
      orgB.organizationId,
      brandA.id,
    )
    expect(bSees).toBeNull()

    await expect(
      orgB.repos.brands.getById(orgA.organizationId, brandA.id),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })

  it('user B cannot reuse A brand id (PK collision / no tenant transfer)', async () => {
    await expect(
      orgB.repos.brands.save({
        ...brandA,
        organizationId: orgB.organizationId,
        name: 'Hijacked',
        normalizedName: 'hijacked',
      }),
    ).rejects.toThrow()

    const stillA = await orgA.repos.brands.getById(
      orgA.organizationId,
      brandA.id,
    )
    expect(stillA?.name).toBe('Brand A Only')
  })

  it('cross-tenant product get returns null; wrong org param denied', async () => {
    expect(
      await orgB.repos.products.getById(orgB.organizationId, productA.id),
    ).toBeNull()
    await expect(
      orgB.repos.products.getById(orgA.organizationId, productA.id),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })

  it('search never returns other tenant hits', async () => {
    const hits = await orgB.repos.search.search({
      organizationId: orgB.organizationId,
      text: 'Secret Product',
      limit: 50,
    })
    expect(hits.every((h) => h.productId !== productA.id)).toBe(true)

    await expect(
      orgB.repos.search.search({
        organizationId: orgA.organizationId,
        text: 'Secret',
        limit: 10,
      }),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })

  it('aggregate children stay within tenant (SQL path cannot steal orphans)', async () => {
    const loaded = await orgA.repos.products.getById(
      orgA.organizationId,
      productA.id,
    )
    expect(loaded?.variants).toHaveLength(1)
    expect(
      loaded?.variants.every((v) => v.organizationId === orgA.organizationId),
    ).toBe(true)
  })

  it('anonymous client cannot create repos (not authenticated)', async () => {
    const anon = createAnonClient()
    await expect(
      createSupabaseCatalogRepos({
        client: anon,
        actorUserId: orgA.userId,
        organizationId: orgA.organizationId,
        databaseUrl: LOCAL_SUPABASE.databaseUrl,
      }),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })

  it('user without membership cannot create repos for foreign org', async () => {
    // Sign in as B but request org A context.
    await expect(
      createSupabaseCatalogRepos({
        client: orgB.client,
        actorUserId: orgB.userId,
        organizationId: orgA.organizationId,
        databaseUrl: LOCAL_SUPABASE.databaseUrl,
      }),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })

  it('actorUserId mismatch against JWT is rejected', async () => {
    await expect(
      createSupabaseCatalogRepos({
        client: orgA.client,
        actorUserId: orgB.userId,
        organizationId: orgA.organizationId,
        databaseUrl: LOCAL_SUPABASE.databaseUrl,
      }),
    ).rejects.toBeInstanceOf(CatalogPermissionError)
  })

  it('SQL direct without org filter would see cross-tenant (proves bypass)', async () => {
    const sql = getCatalogSql(LOCAL_SUPABASE.databaseUrl)
    const rows = await sql<{ id: string; organization_id: string }[]>`
      select id, organization_id from public.brand
      where id = ${brandA.id}::uuid
    `
    // Superuser/owner sees the row — confirming RLS is not protecting this path.
    expect(rows[0]?.organization_id).toBe(orgA.organizationId)
  })

  it('SQL writes scoped by organization_id do not mutate foreign tenant', async () => {
    const sql = getCatalogSql(LOCAL_SUPABASE.databaseUrl)
    const updated = await sql`
      update public.brand
      set name = 'Should Not Apply'
      where id = ${brandA.id}::uuid
        and organization_id = ${orgB.organizationId}::uuid
      returning id
    `
    expect(updated).toHaveLength(0)
    const still = await orgA.repos.brands.getById(
      orgA.organizationId,
      brandA.id,
    )
    expect(still?.name).toBe('Brand A Only')
  })

  it('pagination does not leak other tenants', async () => {
    const page = await orgB.repos.products.listByOrganization(
      orgB.organizationId,
    )
    expect(page.every((p) => p.organizationId === orgB.organizationId)).toBe(
      true,
    )
    expect(page.some((p) => p.id === productA.id)).toBe(false)
  })

  // Silence unused import in case password is needed for future cases
  it('test password constant is defined for harness', () => {
    expect(TEST_PASSWORD.length).toBeGreaterThan(8)
  })
})
