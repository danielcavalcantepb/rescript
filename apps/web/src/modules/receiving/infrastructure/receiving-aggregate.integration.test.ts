// @vitest-environment node
import { afterAll, describe, expect, it } from 'vitest'
import { createCatalogApplicationService } from '#/modules/catalog/application'
import { createInMemoryEventCollector } from '#/modules/catalog/application/ports/event-collector'
import {
  afterAllCatalogPersistence,
  createCatalogPersistenceFixture,
  isLocalSupabaseAvailable,
} from '#/modules/catalog/infrastructure/supabase/test-local-supabase'
import { createInventoryFoundationService } from '#/modules/inventory/application/foundation/inventory-foundation-service'
import { createInMemoryInventoryEventCollector } from '#/modules/inventory/domain/foundation/events'
import { createSupabaseInventoryFoundationRepos } from '#/modules/inventory/infrastructure/foundation/create-supabase-inventory-foundation-repos'
import { createPurchaseService } from '#/modules/purchase/application/purchase-service'
import { createInMemoryPurchaseEventCollector } from '#/modules/purchase/domain/events'
import { createSupabasePurchaseRepos } from '#/modules/purchase/infrastructure/create-supabase-purchase-repos'
import { createReceivingService } from '#/modules/receiving/application/receiving-service'
import { createInMemoryReceivingEventCollector } from '#/modules/receiving/domain/events'
import { createSupabaseReceivingRepos } from '#/modules/receiving/infrastructure/create-supabase-receiving-repos'
import { createSupplierService } from '#/modules/suppliers/application/supplier-service'
import { createInMemorySupplierEventCollector } from '#/modules/suppliers/domain/events'
import { createSupabaseSupplierRepos } from '#/modules/suppliers/infrastructure/create-supabase-supplier-repos'
import { can, permissionsForRole } from '@rescript/permissions'

const available = await isLocalSupabaseAvailable()
const uuidIds = { next: () => crypto.randomUUID() }

describe.skipIf(!available)('receiving aggregate (local Supabase)', () => {
  afterAll(async () => {
    await afterAllCatalogPersistence()
  })

  it(
    'partial/complete receiving posts ENTRY, updates PO, is idempotent and isolates tenants',
    async () => {
      const orgA = await createCatalogPersistenceFixture('gr-a')
      const orgB = await createCatalogPersistenceFixture('gr-b')
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
          name: 'Insumo GR',
          sku: `GR-${crypto.randomUUID().slice(0, 8)}`,
          unitOfMeasureId: orgA.unitOfMeasureId,
        })
        const variantId = product.variants[0]!.id
        const list = await catalogA.createPriceList({
          name: 'GR',
          isDefault: true,
        })
        await catalogA.addPriceEntry({
          priceListId: list.id,
          variantId,
          amount: '5.00',
          validFrom: '2026-01-01T00:00:00.000Z',
        })
        await catalogA.activateProduct({ productId: product.id })

        const invRepos = await createSupabaseInventoryFoundationRepos({
          client: orgA.client,
          actorUserId: orgA.userId,
          organizationId: orgA.organizationId,
        })
        const inventory = createInventoryFoundationService({
          organizationId: orgA.organizationId,
          userId: orgA.userId,
          can: () => true,
          ids: uuidIds,
          clock: { nowIso: () => new Date().toISOString() },
          events: createInMemoryInventoryEventCollector(),
          locations: invRepos.locations,
          items: invRepos.items,
          history: invRepos.history,
          variantLookup: invRepos.variantLookup,
          ledger: invRepos.ledger,
        })
        const location = await inventory.createLocation({
          code: `LOC-${crypto.randomUUID().slice(0, 6)}`,
          name: 'Recebimento',
          isDefault: true,
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
          legalName: 'Fornecedor GR LTDA',
          document: '11444777000161',
          activate: true,
        })

        const purchaseRepos = await createSupabasePurchaseRepos({
          client: orgA.client,
          organizationId: orgA.organizationId,
          actorUserId: orgA.userId,
        })
        const purchases = createPurchaseService({
          organizationId: orgA.organizationId,
          userId: orgA.userId,
          can: (key) => can(grants, key),
          clock: { nowIso: () => new Date().toISOString() },
          ids: uuidIds,
          events: createInMemoryPurchaseEventCollector(),
          numbers: purchaseRepos.numbers,
          snapshots: purchaseRepos.snapshots,
          purchases: purchaseRepos.purchases,
          items: purchaseRepos.items,
          search: purchaseRepos.search,
          history: purchaseRepos.history,
        })
        const po = await purchases.createPurchase({ supplierId: supplier.id })
        await purchases.addItem({
          purchaseOrderId: po.id,
          variantId,
          quantity: '100',
          unitPrice: '5',
        })
        await purchases.approvePurchase(po.id)

        const recvRepos = await createSupabaseReceivingRepos({
          client: orgA.client,
          organizationId: orgA.organizationId,
          actorUserId: orgA.userId,
        })
        const receiving = createReceivingService({
          organizationId: orgA.organizationId,
          userId: orgA.userId,
          can: (key) => can(grants, key),
          clock: { nowIso: () => new Date().toISOString() },
          ids: uuidIds,
          events: createInMemoryReceivingEventCollector(),
          numbers: recvRepos.numbers,
          purchases: recvRepos.purchases,
          receipts: recvRepos.receipts,
          items: recvRepos.items,
          search: recvRepos.search,
          history: recvRepos.history,
          poster: recvRepos.poster,
        })

        const r1 = await receiving.createReceipt({
          purchaseOrderId: po.id,
          locationId: location.id,
          items: [
            {
              purchaseItemId: (await purchases.listItems(po.id))[0]!.id,
              receivedQuantity: '40',
            },
          ],
        })
        expect(r1.receipt.number).toMatch(/^GR-\d{6}$/)

        const idem = `idem-${crypto.randomUUID()}`
        const posted1 = await receiving.postReceipt({
          goodsReceiptId: r1.receipt.id,
          idempotencyKey: idem,
        })
        expect(posted1.receipt.status).toBe('posted')

        const postedAgain = await receiving.postReceipt({
          goodsReceiptId: r1.receipt.id,
          idempotencyKey: idem,
        })
        expect(postedAgain.receipt.id).toBe(posted1.receipt.id)

        const stockAfterPartial = await inventory.listInventoryItems({
          variantId,
          locationId: location.id,
        })
        expect(Number(stockAfterPartial[0]?.quantityOnHand ?? 0)).toBe(40)

        const poItems = await purchases.listItems(po.id)
        expect(Number(poItems[0]!.receivedQuantity)).toBe(40)
        const poAfter = await purchases.getPurchase(po.id)
        expect(poAfter.status).toBe('approved')

        const r2 = await receiving.createReceipt({
          purchaseOrderId: po.id,
          locationId: location.id,
          items: [
            {
              purchaseItemId: poItems[0]!.id,
              receivedQuantity: '60',
            },
          ],
        })
        await receiving.postReceipt({
          goodsReceiptId: r2.receipt.id,
          idempotencyKey: `idem-${crypto.randomUUID()}`,
        })

        const poClosed = await purchases.getPurchase(po.id)
        expect(poClosed.status).toBe('closed')
        const stockFinal = await inventory.listInventoryItems({
          variantId,
          locationId: location.id,
        })
        expect(Number(stockFinal[0]?.quantityOnHand ?? 0)).toBe(100)

        const recvB = await createSupabaseReceivingRepos({
          client: orgB.client,
          organizationId: orgB.organizationId,
          actorUserId: orgB.userId,
        })
        const appB = createReceivingService({
          organizationId: orgB.organizationId,
          userId: orgB.userId,
          can: (key) => can(permissionsForRole('manager'), key),
          clock: { nowIso: () => new Date().toISOString() },
          ids: uuidIds,
          events: createInMemoryReceivingEventCollector(),
          numbers: recvB.numbers,
          purchases: recvB.purchases,
          receipts: recvB.receipts,
          items: recvB.items,
          search: recvB.search,
          history: recvB.history,
          poster: recvB.poster,
        })
        await expect(appB.getReceipt(r1.receipt.id)).rejects.toThrow(/not_found/)
        const cross = await appB.searchReceipts({ q: r1.receipt.number })
        expect(cross).toHaveLength(0)
      } finally {
        await orgA.cleanup()
        await orgB.cleanup()
      }
    },
    90_000,
  )
})
