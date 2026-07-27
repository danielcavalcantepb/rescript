// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { createCatalogApplicationService } from '#/modules/catalog/application'
import { createInMemoryEventCollector } from '#/modules/catalog/application/ports/event-collector'
import {
  afterAllCatalogPersistence,
  createCatalogPersistenceFixture,
  getCatalogSql,
  isLocalSupabaseAvailable,
  LOCAL_SUPABASE,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'
import { createInventoryFoundationService } from '#/modules/inventory/application/foundation/inventory-foundation-service'
import { createInMemoryInventoryEventCollector } from '#/modules/inventory/domain/foundation/events'
import { createSupabaseInventoryFoundationRepos } from '#/modules/inventory/infrastructure/foundation/create-supabase-inventory-foundation-repos'

const available = await isLocalSupabaseAvailable()
const uuidIds = { next: () => crypto.randomUUID() }

describe.skipIf(!available)(
  'inventory security hardening (local Supabase)',
  () => {
    afterAll(async () => {
      await afterAllCatalogPersistence()
    })

    it('enforces RLS, SQL permissions, ledger-only balances and reconciliation', async () => {
      const owner = await createCatalogPersistenceFixture('inv-sec-owner')
      const outsider = await createCatalogPersistenceFixture('inv-sec-outsider')
      const sql = getCatalogSql(LOCAL_SUPABASE.databaseUrl)

      try {
        const catalog = createCatalogApplicationService({
          organizationId: owner.organizationId,
          userId: owner.userId,
          can: () => true,
          ids: uuidIds,
          clock: { nowIso: () => new Date().toISOString() },
          events: createInMemoryEventCollector(),
          products: owner.repos.products,
          brands: owner.repos.brands,
          categories: owner.repos.categories,
          priceLists: owner.repos.priceLists,
          attributes: owner.repos.attributes,
          units: owner.repos.units,
          lifecycleAudit: owner.repos.lifecycleAudit,
          priceHistory: owner.repos.priceHistory,
        })
        const product = await catalog.createProduct({
          name: 'Secure inventory item',
          sku: `SEC-${crypto.randomUUID().slice(0, 8)}`,
          unitOfMeasureId: owner.unitOfMeasureId,
        })
        const variantId = product.variants[0]!.id
        const priceList = await catalog.createPriceList({
          name: 'Padrão',
          isDefault: true,
        })
        await catalog.addPriceEntry({
          priceListId: priceList.id,
          variantId,
          amount: '10.00',
          validFrom: '2026-01-01T00:00:00.000Z',
        })
        await catalog.activateProduct({ productId: product.id })

        const repos = await createSupabaseInventoryFoundationRepos({
          client: owner.client,
          actorUserId: owner.userId,
          organizationId: owner.organizationId,
        })
        const inventory = createInventoryFoundationService({
          organizationId: owner.organizationId,
          userId: owner.userId,
          can: () => true,
          ids: uuidIds,
          clock: { nowIso: () => new Date().toISOString() },
          events: createInMemoryInventoryEventCollector(),
          locations: repos.locations,
          items: repos.items,
          history: repos.history,
          variantLookup: repos.variantLookup,
          ledger: repos.ledger,
        })
        const location = await inventory.createLocation({
          code: 'SECURE',
          name: 'Secure location',
          isDefault: true,
        })

        const crossTenant = await outsider.client
          .from('inventory_item')
          .select('id')
          .eq('organization_id', owner.organizationId)
        expect(crossTenant.error).toBeNull()
        expect(crossTenant.data).toEqual([])

        const positiveInsert = await owner.client.from('inventory_item').insert({
          id: crypto.randomUUID(),
          organization_id: owner.organizationId,
          location_id: location.id,
          variant_id: variantId,
          qty_on_hand: 50,
          qty_reserved: 0,
          status: 'active',
          created_by: owner.userId,
          updated_by: owner.userId,
        })
        expect(positiveInsert.error?.code).toBe('42501')

        const item = await inventory.createInventoryItem({
          variantId,
          locationId: location.id,
        })

        const directUpdate = await owner.client
          .from('inventory_item')
          .update({
            qty_on_hand: 10,
            updated_by: owner.userId,
          })
          .eq('id', item.id)
          .eq('organization_id', owner.organizationId)
        expect(directUpdate.error?.code).toBe('42501')

        const outsiderRpc = await outsider.client.rpc(
          'register_inventory_ledger_movement',
          {
            p_organization_id: owner.organizationId,
            p_variant_id: variantId,
            p_location_id: location.id,
            p_type: 'entry',
            p_quantity: 1,
            p_reason: 'cross tenant',
            p_idempotency_key: `cross-${crypto.randomUUID()}`,
          },
        )
        expect(outsiderRpc.error?.code).toBe('42501')

        await sql`
          insert into public.membership (
            organization_id, user_id, role, status, is_owner, created_by
          ) values (
            ${owner.organizationId}::uuid,
            ${outsider.userId}::uuid,
            'viewer',
            'active',
            false,
            ${owner.userId}::uuid
          )
        `

        const viewerInsert = await outsider.client.from('inventory_item').insert({
          id: crypto.randomUUID(),
          organization_id: owner.organizationId,
          location_id: location.id,
          variant_id: variantId,
          qty_on_hand: 0,
          qty_reserved: 0,
          status: 'active',
          created_by: outsider.userId,
          updated_by: outsider.userId,
        })
        expect(viewerInsert.error).not.toBeNull()

        const viewerRpc = await outsider.client.rpc(
          'register_inventory_ledger_movement',
          {
            p_organization_id: owner.organizationId,
            p_variant_id: variantId,
            p_location_id: location.id,
            p_type: 'entry',
            p_quantity: 1,
            p_reason: 'viewer denied',
            p_idempotency_key: `viewer-${crypto.randomUUID()}`,
          },
        )
        expect(viewerRpc.error?.code).toBe('42501')

        const idem = `secure-entry-${crypto.randomUUID()}`
        const first = await owner.client.rpc(
          'register_inventory_ledger_movement',
          {
            p_organization_id: owner.organizationId,
            p_variant_id: variantId,
            p_location_id: location.id,
            p_type: 'entry',
            p_quantity: 1,
            p_reason: 'opening',
            p_idempotency_key: idem,
          },
        )
        expect(first.error).toBeNull()
        const repeated = await owner.client.rpc(
          'register_inventory_ledger_movement',
          {
            p_organization_id: owner.organizationId,
            p_variant_id: variantId,
            p_location_id: location.id,
            p_type: 'entry',
            p_quantity: 1,
            p_reason: 'opening',
            p_idempotency_key: idem,
          },
        )
        expect(repeated.error).toBeNull()
        expect(repeated.data?.id).toBe(first.data?.id)

        const exits = await Promise.all([
          owner.client.rpc('register_inventory_ledger_movement', {
            p_organization_id: owner.organizationId,
            p_variant_id: variantId,
            p_location_id: location.id,
            p_type: 'exit',
            p_quantity: 1,
            p_reason: 'concurrent exit A',
            p_idempotency_key: `exit-a-${crypto.randomUUID()}`,
          }),
          owner.client.rpc('register_inventory_ledger_movement', {
            p_organization_id: owner.organizationId,
            p_variant_id: variantId,
            p_location_id: location.id,
            p_type: 'exit',
            p_quantity: 1,
            p_reason: 'concurrent exit B',
            p_idempotency_key: `exit-b-${crypto.randomUUID()}`,
          }),
        ])
        expect(exits.filter((result) => result.error === null)).toHaveLength(1)
        expect(
          exits.filter((result) => result.error?.message.includes('insufficient_stock')),
        ).toHaveLength(1)

        const beforeRollback = await owner.client
          .from('inventory_ledger_movement')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', owner.organizationId)
        const rejected = await owner.client.rpc(
          'register_inventory_ledger_movement',
          {
            p_organization_id: owner.organizationId,
            p_variant_id: variantId,
            p_location_id: location.id,
            p_type: 'exit',
            p_quantity: 5,
            p_reason: 'must rollback',
            p_idempotency_key: `rollback-${crypto.randomUUID()}`,
          },
        )
        expect(rejected.error?.message).toContain('insufficient_stock')
        const afterRollback = await owner.client
          .from('inventory_ledger_movement')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', owner.organizationId)
        expect(afterRollback.count).toBe(beforeRollback.count)

        const reconciled = await owner.client.rpc(
          'reconcile_inventory_ledger' as never,
          {
            p_organization_id: owner.organizationId,
            p_only_inconsistent: true,
          } as never,
        )
        expect(reconciled.error).toBeNull()
        expect(reconciled.data).toEqual([])

        await sql.begin(async (tx) => {
          await tx`select set_config('inventory.allow_projection', 'on', true)`
          await tx`
            update public.inventory_item
            set qty_on_hand = qty_on_hand + 2
            where id = ${item.id}::uuid
          `
        })
        const divergent = await owner.client.rpc(
          'reconcile_inventory_ledger' as never,
          {
            p_organization_id: owner.organizationId,
            p_only_inconsistent: true,
          } as never,
        )
        expect(divergent.error).toBeNull()
        expect(divergent.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              inventory_item_id: item.id,
              issues: expect.arrayContaining(['balance_divergence']),
            }),
          ]),
        )

        const audits = await sql<{ action: string }[]>`
          select action
          from public.audit_event
          where organization_id = ${owner.organizationId}::uuid
        `
        expect(audits).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ action: 'StockLocationCreated' }),
            expect.objectContaining({ action: 'InventoryItemCreated' }),
            expect.objectContaining({ action: 'InventoryMovementRegistered' }),
          ]),
        )
        const firstMovementAudits = audits.filter(
          ({ action }) => action === 'InventoryMovementRegistered',
        )
        const movements = await sql<{ id: string }[]>`
          select id
          from public.inventory_ledger_movement
          where organization_id = ${owner.organizationId}::uuid
        `
        expect(firstMovementAudits).toHaveLength(movements.length)
      } finally {
        await owner.cleanup()
        await outsider.cleanup()
      }
    })
  },
)
