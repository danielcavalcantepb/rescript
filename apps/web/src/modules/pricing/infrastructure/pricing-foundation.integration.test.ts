// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { createCatalogApplicationService } from '#/modules/catalog/application'
import { createInMemoryEventCollector } from '#/modules/catalog/application/ports/event-collector'
import {
  afterAllCatalogPersistence,
  createCatalogPersistenceFixture,
  isLocalSupabaseAvailable,
  LOCAL_SUPABASE,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'
import { getCatalogSql } from '#/modules/catalog/infrastructure/supabase/index.server'

const available = await isLocalSupabaseAvailable()

function application(
  fixture: Awaited<ReturnType<typeof createCatalogPersistenceFixture>>,
) {
  return createCatalogApplicationService({
    organizationId: fixture.organizationId,
    userId: fixture.userId,
    can: () => true,
    ids: { next: () => crypto.randomUUID() },
    clock: { nowIso: () => new Date().toISOString() },
    events: createInMemoryEventCollector(),
    products: fixture.repos.products,
    brands: fixture.repos.brands,
    categories: fixture.repos.categories,
    priceLists: fixture.repos.priceLists,
    attributes: fixture.repos.attributes,
    units: fixture.repos.units,
    lifecycleAudit: fixture.repos.lifecycleAudit,
    priceHistory: fixture.repos.priceHistory,
  })
}

async function rpc<T>(
  fixture: Awaited<ReturnType<typeof createCatalogPersistenceFixture>>,
  name: string,
  args: Record<string, unknown>,
) {
  const result = (await fixture.client.rpc(
    name as never,
    args as never,
  )) as unknown as { data: T | null; error: { message: string } | null }
  return result
}

describe.skipIf(!available)('Pricing Foundation (local Supabase)', () => {
  afterAll(afterAllCatalogPersistence)

  it('creates, projects, resolves and audits a canonical price', async () => {
    const fixture = await createCatalogPersistenceFixture('pricing-foundation')
    try {
      const product = await application(fixture).createProduct({
        name: 'Produto Pricing',
        sku: `PR-${crypto.randomUUID().slice(0, 8)}`,
        unitOfMeasureId: fixture.unitOfMeasureId,
      })
      const variantId = product.variants[0]!.id
      const list = await rpc<string>(fixture, 'create_price_list', {
        p_organization_id: fixture.organizationId,
        p_name: 'Varejo',
        p_code: 'VAREJO',
        p_currency: 'BRL',
        p_valid_from: '2026-01-01',
        p_valid_to: null,
      })
      expect(list.error).toBeNull()

      const item = await rpc<string>(fixture, 'create_price_list_item', {
        p_organization_id: fixture.organizationId,
        p_price_list_id: list.data,
        p_variant_id: variantId,
        p_amount: '199.90',
        p_minimum_amount: '149.90',
        p_valid_from: '2026-01-01T00:00:00Z',
        p_valid_to: null,
      })
      expect(item.error).toBeNull()

      const resolved = await rpc<{ amount: string; minimumAmount: string }>(
        fixture,
        'resolve_price',
        {
          p_organization_id: fixture.organizationId,
          p_price_list_id: list.data,
          p_variant_id: variantId,
          p_at: '2026-07-27T12:00:00Z',
        },
      )
      expect(resolved.error).toBeNull()
      expect(resolved.data?.amount).toBe('199.900000')
      expect(resolved.data?.minimumAmount).toBe('149.900000')

      const projection = await rpc<{ total: number }>(
        fixture,
        'list_price_list_items',
        {
          p_organization_id: fixture.organizationId,
          p_search: 'Produto Pricing',
          p_status: 'active',
          p_price_list_id: list.data,
          p_product_id: null,
          p_variant_id: null,
          p_page: 1,
          p_page_size: 25,
        },
      )
      expect(projection.data?.total).toBe(1)

      const updated = await rpc<null>(fixture, 'update_price_list_item', {
        p_organization_id: fixture.organizationId,
        p_item_id: item.data,
        p_amount: '209.90',
        p_minimum_amount: '159.90',
        p_valid_from: '2026-01-01T00:00:00Z',
        p_valid_to: null,
      })
      expect(updated.error).toBeNull()

      const renamed = await rpc<null>(fixture, 'update_price_list', {
        p_organization_id: fixture.organizationId,
        p_price_list_id: list.data,
        p_name: 'Varejo Nacional',
        p_code: 'VAREJO',
        p_valid_from: '2026-01-01',
        p_valid_to: null,
      })
      expect(renamed.error).toBeNull()

      const sql = getCatalogSql(LOCAL_SUPABASE.databaseUrl)
      const audit = await sql<{ action: string }[]>`
        select action from public.audit_event
        where organization_id = ${fixture.organizationId}::uuid
          and action in (
            'PriceListCreated', 'PriceListItemCreated',
            'PriceListUpdated', 'PriceListItemUpdated'
          )
        order by action
      `
      expect(audit.map((event) => event.action)).toEqual([
        'PriceListCreated',
        'PriceListItemCreated',
        'PriceListItemUpdated',
        'PriceListUpdated',
      ])

      const archived = await rpc<null>(fixture, 'archive_price_list', {
        p_organization_id: fixture.organizationId,
        p_price_list_id: list.data,
      })
      expect(archived.error).toBeNull()
      const afterArchive = await rpc(fixture, 'resolve_price', {
        p_organization_id: fixture.organizationId,
        p_price_list_id: list.data,
        p_variant_id: variantId,
        p_at: '2026-07-27T12:00:00Z',
      })
      expect(afterArchive.data).toBeNull()
    } finally {
      await fixture.cleanup()
    }
  })

  it('rejects overlapping concurrent items and cross-tenant access', async () => {
    const first = await createCatalogPersistenceFixture('pricing-race-a')
    const second = await createCatalogPersistenceFixture('pricing-race-b')
    try {
      const product = await application(first).createProduct({
        name: 'Produto Concorrente',
        sku: `PC-${crypto.randomUUID().slice(0, 8)}`,
        unitOfMeasureId: first.unitOfMeasureId,
      })
      const variantId = product.variants[0]!.id
      const list = await rpc<string>(first, 'create_price_list', {
        p_organization_id: first.organizationId,
        p_name: 'Atacado',
        p_code: 'ATACADO',
        p_currency: 'BRL',
        p_valid_from: '2026-01-01',
        p_valid_to: null,
      })
      const command = {
        p_organization_id: first.organizationId,
        p_price_list_id: list.data,
        p_variant_id: variantId,
        p_amount: '100',
        p_minimum_amount: '80',
        p_valid_from: '2026-01-01T00:00:00Z',
        p_valid_to: null,
      }
      const concurrent = await Promise.all([
        rpc<string>(first, 'create_price_list_item', command),
        rpc<string>(first, 'create_price_list_item', command),
      ])
      expect(concurrent.filter((result) => result.error == null)).toHaveLength(1)
      expect(concurrent.filter((result) => result.error != null)).toHaveLength(1)

      const crossTenant = await rpc(second, 'resolve_price', {
        p_organization_id: first.organizationId,
        p_price_list_id: list.data,
        p_variant_id: variantId,
        p_at: '2026-07-27T12:00:00Z',
      })
      const permission = await rpc<boolean>(second, 'pricing_has_permission', {
        p_org: first.organizationId,
        p_permission: 'prices.resolve',
      })
      expect(permission.data).toBe(false)
      expect(crossTenant.error).toBeTruthy()
      expect(JSON.stringify(crossTenant.error)).toContain('permission_denied')

      const directInsert = await first.client.from('price_list').insert({
        organization_id: first.organizationId,
        name: 'Bypass',
        currency: 'BRL',
        is_default: false,
        status: 'active',
        created_by: first.userId,
        updated_by: first.userId,
      })
      expect(directInsert.error).not.toBeNull()
    } finally {
      await first.cleanup()
      await second.cleanup()
    }
  })
})
