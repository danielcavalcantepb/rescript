import { describe, expect, it } from 'vitest'
import { createPurchaseService } from '#/modules/purchase/application/purchase-service'
import { createMemoryPurchaseRepos } from '#/modules/purchase/application/memory-purchase'
import { createInMemoryPurchaseEventCollector } from '#/modules/purchase/domain/events'
import type { PermissionKey } from '@rescript/permissions'

const ALL_PURCHASE: PermissionKey[] = [
  'purchase.read',
  'purchase.create',
  'purchase.edit',
  'purchase.approve',
  'purchase.cancel',
  'purchase.archive',
  'purchase.restore',
  'purchase.items.manage',
]

function app(grants: PermissionKey[] = ALL_PURCHASE) {
  const repos = createMemoryPurchaseRepos({
    suppliers: [
      {
        supplierId: 'sup_1',
        legalName: 'Fornecedor Alpha',
        document: '11444777000161',
        email: 'a@test.com',
        phone: null,
      },
    ],
    variants: [
      {
        variantId: 'var_1',
        sku: 'SKU-1',
        name: 'Produto A',
        unitCode: 'UN',
        description: 'Desc',
      },
    ],
    prices: {
      var_1: {
        currency: 'BRL',
        unitPrice: '10.0000',
        priceListId: 'pl_1',
        source: 'price_list',
      },
    },
  })
  const events = createInMemoryPurchaseEventCollector()
  const service = createPurchaseService({
    organizationId: 'org_1',
    userId: 'user_1',
    can: (key) => grants.includes(key),
    clock: { nowIso: () => '2026-07-26T00:00:00.000Z' },
    ids: { next: () => 'id' },
    events,
    numbers: repos.numbers,
    snapshots: repos.snapshots,
    purchases: repos.purchases,
    items: repos.items,
    search: repos.search,
    history: repos.history,
  })
  return { service, events, repos }
}

describe('Purchase aggregate application', () => {
  it('creates PO with number, snapshots, totals, lifecycle and search', async () => {
    const { service, events } = app()

    const order = await service.createPurchase({
      supplierId: 'sup_1',
      notes: 'Primeira compra',
    })
    expect(order.number).toBe('PO-000001')
    expect(order.status).toBe('draft')
    expect(order.supplierSnapshot.legalName).toBe('Fornecedor Alpha')
    expect(order.totals.grandTotal).toBe('0.0000')

    const item = await service.addItem({
      purchaseOrderId: order.id,
      variantId: 'var_1',
      quantity: '2',
    })
    expect(item.variantName).toBe('Produto A')
    expect(item.priceSource).toBe('price_list')
    expect(item.total).toBe('20.0000')

    const snap = await service.getPurchaseSnapshot(order.id)
    expect(snap.order.totals.grandTotal).toBe('20.0000')
    expect(snap.items).toHaveLength(1)

    const approved = await service.approvePurchase(order.id)
    expect(approved.status).toBe('approved')

    await expect(
      service.addItem({
        purchaseOrderId: order.id,
        variantId: 'var_1',
        quantity: '1',
        unitPrice: '5',
      }),
    ).rejects.toThrow(/rascunho/i)

    await service.cancelPurchase(order.id, 'mudança de plano')
    await service.archivePurchase(order.id)
    const restored = await service.restorePurchase(order.id)
    expect(restored.status).toBe('cancelled')

    const search = await service.searchPurchases({ q: 'PO-000001' })
    expect(search.some((x) => x.id === order.id)).toBe(true)

    const history = await service.listHistory(order.id)
    expect(history.some((h) => h.action === 'purchase.created')).toBe(true)
    expect(history.some((h) => h.action === 'purchase.item_added')).toBe(true)

    const drained = events.drain()
    expect(drained.some((e) => e.type === 'PurchaseCreated')).toBe(true)
    expect(drained.some((e) => e.type === 'PurchaseItemAdded')).toBe(true)
    expect(drained.some((e) => e.type === 'PurchaseApproved')).toBe(true)
  })

  it('freezes price snapshot and ignores later price seed changes', async () => {
    const { service, repos } = app()
    const order = await service.createPurchase({ supplierId: 'sup_1' })
    const item = await service.addItem({
      purchaseOrderId: order.id,
      variantId: 'var_1',
      quantity: '1',
    })
    expect(item.unitPrice).toBe('10.0000')
    repos.seedPrice('var_1', {
      currency: 'BRL',
      unitPrice: '99.0000',
      priceListId: 'pl_2',
      source: 'price_list',
    })
    const again = await service.listItems(order.id)
    expect(again[0]!.unitPrice).toBe('10.0000')
  })

  it('enforces permissions', async () => {
    const { service } = app(['purchase.read'])
    await expect(
      service.createPurchase({ supplierId: 'sup_1' }),
    ).rejects.toThrow(/permission/)
  })

  it('isolates organizations in memory search', async () => {
    const repos = createMemoryPurchaseRepos({
      suppliers: [
        {
          supplierId: 'sup_1',
          legalName: 'Only A',
          document: null,
          email: null,
          phone: null,
        },
      ],
    })
    const a = createPurchaseService({
      organizationId: 'org_a',
      userId: 'u',
      can: () => true,
      clock: { nowIso: () => new Date().toISOString() },
      ids: { next: () => crypto.randomUUID() },
      events: createInMemoryPurchaseEventCollector(),
      numbers: repos.numbers,
      snapshots: repos.snapshots,
      purchases: repos.purchases,
      items: repos.items,
      search: repos.search,
      history: repos.history,
    })
    const b = createPurchaseService({
      organizationId: 'org_b',
      userId: 'u',
      can: () => true,
      clock: { nowIso: () => new Date().toISOString() },
      ids: { next: () => crypto.randomUUID() },
      events: createInMemoryPurchaseEventCollector(),
      numbers: repos.numbers,
      snapshots: repos.snapshots,
      purchases: repos.purchases,
      items: repos.items,
      search: repos.search,
      history: repos.history,
    })
    await a.createPurchase({ supplierId: 'sup_1' })
    const hits = await b.searchPurchases({ q: 'Only' })
    expect(hits).toHaveLength(0)
  })

  it('requires unit price when price list missing', async () => {
    const repos = createMemoryPurchaseRepos({
      suppliers: [
        {
          supplierId: 'sup_1',
          legalName: 'X',
          document: null,
          email: null,
          phone: null,
        },
      ],
      variants: [
        {
          variantId: 'var_x',
          sku: null,
          name: 'X',
          unitCode: 'UN',
          description: null,
        },
      ],
    })
    const service = createPurchaseService({
      organizationId: 'org_1',
      userId: 'u',
      can: () => true,
      clock: { nowIso: () => new Date().toISOString() },
      ids: { next: () => crypto.randomUUID() },
      events: createInMemoryPurchaseEventCollector(),
      numbers: repos.numbers,
      snapshots: repos.snapshots,
      purchases: repos.purchases,
      items: repos.items,
      search: repos.search,
      history: repos.history,
    })
    const order = await service.createPurchase({ supplierId: 'sup_1' })
    await expect(
      service.addItem({
        purchaseOrderId: order.id,
        variantId: 'var_x',
        quantity: '1',
      }),
    ).rejects.toThrow(/validation/)
    const item = await service.addItem({
      purchaseOrderId: order.id,
      variantId: 'var_x',
      quantity: '1',
      unitPrice: '7.5',
    })
    expect(item.priceSource).toBe('manual')
  })
})
