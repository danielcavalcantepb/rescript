// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { createCatalogApplicationService } from '#/modules/catalog/application'
import { createInMemoryEventCollector } from '#/modules/catalog/application/ports/event-collector'
import {
  afterAllCatalogPersistence,
  createCatalogPersistenceFixture,
  isLocalSupabaseAvailable,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'
import { createPurchaseService } from '#/modules/purchase/application/purchase-service'
import { createInMemoryPurchaseEventCollector } from '#/modules/purchase/domain/events'
import { createSupabasePurchaseRepos } from '#/modules/purchase/infrastructure/create-supabase-purchase-repos'
import { createSupplierService } from '#/modules/suppliers/application/supplier-service'
import { createInMemorySupplierEventCollector } from '#/modules/suppliers/domain/events'
import { createSupabaseSupplierRepos } from '#/modules/suppliers/infrastructure/create-supabase-supplier-repos'
import { can, permissionsForRole } from '@rescript/permissions'

const available = await isLocalSupabaseAvailable()
const uuidIds = { next: () => crypto.randomUUID() }

describe.skipIf(!available)('purchase aggregate (local Supabase)', () => {
  afterAll(async () => {
    await afterAllCatalogPersistence()
  })

  it(
    'persists PO, snapshots, search, lifecycle and isolates tenants',
    async () => {
      const orgA = await createCatalogPersistenceFixture('po-a')
      const orgB = await createCatalogPersistenceFixture('po-b')
      try {
        const grants = permissionsForRole('manager')
        const catalogA = createCatalogApplicationService({
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

        const product = await catalogA.createProduct({
          name: 'Insumo Compra',
          sku: `PO-${crypto.randomUUID().slice(0, 8)}`,
          unitOfMeasureId: orgA.unitOfMeasureId,
        })
        const variantId = product.variants[0]!.id
        const list = await catalogA.createPriceList({
          name: 'Compra',
          isDefault: true,
        })
        await catalogA.addPriceEntry({
          priceListId: list.id,
          variantId,
          amount: '12.50',
          validFrom: '2026-01-01T00:00:00.000Z',
        })

        const supplierRepos = await createSupabaseSupplierRepos({
          client: orgA.client,
          organizationId: orgA.organizationId,
          actorUserId: orgA.userId,
        })
        const suppliers = createSupplierService({
          organizationId: orgA.organizationId,
          userId: orgA.userId,
          can: (key) => can(grants, key),
          clock: { nowIso: () => new Date().toISOString() },
          ids: uuidIds,
          events: createInMemorySupplierEventCollector(),
          suppliers: supplierRepos.suppliers,
          search: supplierRepos.search,
          contacts: supplierRepos.contacts,
          addresses: supplierRepos.addresses,
          history: supplierRepos.history,
        })
        const supplier = await suppliers.createSupplier({
          personType: 'PJ',
          legalName: 'Fornecedor PO LTDA',
          document: '11444777000161',
          email: 'po@supplier.test',
          activate: true,
        })

        const reposA = await createSupabasePurchaseRepos({
          client: orgA.client,
          organizationId: orgA.organizationId,
          actorUserId: orgA.userId,
        })
        const appA = createPurchaseService({
          organizationId: orgA.organizationId,
          userId: orgA.userId,
          can: (key) => can(grants, key),
          clock: { nowIso: () => new Date().toISOString() },
          ids: uuidIds,
          events: createInMemoryPurchaseEventCollector(),
          numbers: reposA.numbers,
          snapshots: reposA.snapshots,
          purchases: reposA.purchases,
          items: reposA.items,
          search: reposA.search,
          history: reposA.history,
        })

        const order = await appA.createPurchase({
          supplierId: supplier.id,
          notes: 'PO integration',
        })
        expect(order.number).toMatch(/^PO-\d{6}$/)
        expect(order.supplierSnapshot.legalName).toBe('Fornecedor PO LTDA')

        const item = await appA.addItem({
          purchaseOrderId: order.id,
          variantId,
          priceListId: list.id,
          quantity: '2',
        })
        expect(item.unitPrice).toBe('12.5000')
        expect(item.priceSource).toBe('price_list')
        expect(item.variantName).toContain('Insumo Compra')

        const snap = await appA.getPurchaseSnapshot(order.id)
        expect(snap.order.totals.grandTotal).toBe('25.0000')

        await appA.sendPurchase(order.id)
        await appA.confirmPurchase(order.id)
        const search = await appA.searchPurchases({ q: order.number })
        expect(search.some((x) => x.id === order.id)).toBe(true)

        const history = await appA.listHistory(order.id)
        expect(history.some((h) => h.action === 'purchase.created')).toBe(true)

        const reposB = await createSupabasePurchaseRepos({
          client: orgB.client,
          organizationId: orgB.organizationId,
          actorUserId: orgB.userId,
        })
        const appB = createPurchaseService({
          organizationId: orgB.organizationId,
          userId: orgB.userId,
          can: (key) => can(permissionsForRole('manager'), key),
          clock: { nowIso: () => new Date().toISOString() },
          ids: uuidIds,
          events: createInMemoryPurchaseEventCollector(),
          numbers: reposB.numbers,
          snapshots: reposB.snapshots,
          purchases: reposB.purchases,
          items: reposB.items,
          search: reposB.search,
          history: reposB.history,
        })
        await expect(appB.getPurchase(order.id)).rejects.toThrow(/not_found/)
        const cross = await appB.searchPurchases({ q: order.number })
        expect(cross).toHaveLength(0)
      } finally {
        await orgA.cleanup()
        await orgB.cleanup()
      }
    },
    60_000,
  )
})
