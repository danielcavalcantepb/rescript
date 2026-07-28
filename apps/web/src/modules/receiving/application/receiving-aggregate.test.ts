import { describe, expect, it } from 'vitest'
import { createReceivingService } from '#/modules/receiving/application/receiving-service'
import { createMemoryReceivingRepos } from '#/modules/receiving/application/memory-receiving'
import { createInMemoryReceivingEventCollector } from '#/modules/receiving/domain/events'
import type { PermissionKey } from '@rescript/permissions'

const ALL: PermissionKey[] = [
  'receiving.read',
  'receiving.create',
  'receiving.post',
  'receiving.cancel',
  'receiving.archive',
  'receiving.restore',
  'receiving.receive',
]

function seedPurchase(overrides?: { quantity?: string }) {
  const qty = overrides?.quantity ?? '100.0000'
  return {
    purchaseOrderId: 'po_1',
    purchaseNumber: 'PO-000001',
    status: 'approved',
    supplier: {
      supplierId: 'sup_1',
      legalName: 'Fornecedor Rec',
      document: '11444777000161',
    },
    items: [
      {
        purchaseItemId: 'pi_1',
        variantId: 'var_1',
        variantSku: 'SKU-1',
        variantName: 'Insumo',
        unitCode: 'UN',
        orderedQuantity: qty,
        receivedQuantity: '0.0000',
        pendingQuantity: qty,
        status: 'active' as const,
      },
    ],
  }
}

function app(grants: PermissionKey[] = ALL) {
  const repos = createMemoryReceivingRepos({
    purchases: [seedPurchase()],
  })
  const events = createInMemoryReceivingEventCollector()
  const service = createReceivingService({
    organizationId: 'org_1',
    userId: 'user_1',
    can: (key) => grants.includes(key),
    clock: { nowIso: () => '2026-07-26T00:00:00.000Z' },
    ids: { next: () => 'id' },
    events,
    numbers: repos.numbers,
    purchases: repos.purchases,
    receipts: repos.receipts,
    items: repos.items,
    search: repos.search,
    history: repos.history,
    poster: repos.poster,
  })
  return { service, events, repos }
}

describe('Receiving aggregate application', () => {
  it('creates GR number, partial then complete receiving, posts ledger ENTRY', async () => {
    const { service, events, repos } = app()

    const created = await service.createReceipt({
      purchaseOrderId: 'po_1',
      locationId: 'loc_1',
      items: [{ purchaseItemId: 'pi_1', receivedQuantity: '20' }],
    })
    expect(created.receipt.number).toBe('GR-000001')
    expect(created.items[0]!.receivedQuantity).toBe('20')

    const posted1 = await service.postReceipt({
      goodsReceiptId: created.receipt.id,
      idempotencyKey: 'idem-1',
    })
    expect(posted1.receipt.status).toBe('posted')
    expect(repos._ledger).toHaveLength(1)
    expect(repos._ledger[0]!.quantity).toBe('20')
    expect(repos._purchases.get('po_1')!.status).toBe('approved')
    expect(repos._purchases.get('po_1')!.items[0]!.receivedQuantity).toBe(
      '20.0000',
    )

    const again = await service.postReceipt({
      goodsReceiptId: created.receipt.id,
      idempotencyKey: 'idem-1',
    })
    expect(again.receipt.id).toBe(posted1.receipt.id)
    expect(again.receipt.status).toBe('posted')
    expect(repos._ledger).toHaveLength(1)

    const created2 = await service.createReceipt({
      purchaseOrderId: 'po_1',
      locationId: 'loc_1',
      items: [{ purchaseItemId: 'pi_1', receivedQuantity: '80' }],
    })
    const posted2 = await service.postReceipt({
      goodsReceiptId: created2.receipt.id,
      idempotencyKey: 'idem-2',
    })
    expect(posted2.receipt.status).toBe('posted')
    expect(repos._purchases.get('po_1')!.status).toBe('closed')
    expect(repos._ledger).toHaveLength(2)

    const drained = events.drain()
    expect(drained.some((e) => e.type === 'GoodsReceiptCreated')).toBe(true)
    expect(drained.some((e) => e.type === 'GoodsReceiptPosted')).toBe(true)
    expect(drained.some((e) => e.type === 'InventoryEntryCreated')).toBe(true)
    expect(drained.some((e) => e.type === 'PartialReceivingCompleted')).toBe(
      true,
    )
    expect(drained.some((e) => e.type === 'PurchaseCompleted')).toBe(true)
  })

  it('enforces permissions', async () => {
    const { service } = app(['receiving.read'])
    await expect(
      service.createReceipt({
        purchaseOrderId: 'po_1',
        locationId: 'loc_1',
      }),
    ).rejects.toThrow(/permission/)
  })

  it('accepts the canonical confirmed Purchase Order lifecycle', async () => {
    const { service, repos } = app()
    repos._purchases.get('po_1')!.status = 'confirmed'
    const created = await service.createReceipt({
      purchaseOrderId: 'po_1',
      locationId: 'loc_1',
      items: [{ purchaseItemId: 'pi_1', receivedQuantity: '10' }],
    })
    const completed = await service.postReceipt({
      goodsReceiptId: created.receipt.id,
      idempotencyKey: 'confirmed-po',
    })
    expect(completed.receipt.status).toBe('posted')
    expect(repos._ledger).toHaveLength(1)
  })

  it('isolates organizations in search', async () => {
    const repos = createMemoryReceivingRepos({
      purchases: [seedPurchase()],
    })
    const a = createReceivingService({
      organizationId: 'org_a',
      userId: 'u',
      can: () => true,
      clock: { nowIso: () => new Date().toISOString() },
      ids: { next: () => crypto.randomUUID() },
      events: createInMemoryReceivingEventCollector(),
      ...repos,
    })
    const b = createReceivingService({
      organizationId: 'org_b',
      userId: 'u',
      can: () => true,
      clock: { nowIso: () => new Date().toISOString() },
      ids: { next: () => crypto.randomUUID() },
      events: createInMemoryReceivingEventCollector(),
      ...repos,
    })
    await a.createReceipt({ purchaseOrderId: 'po_1', locationId: 'loc' })
    const hits = await b.searchReceipts({ q: 'GR-' })
    expect(hits).toHaveLength(0)
  })

  it('rejects receive exceeding pending without over policy', async () => {
    const { service } = app()
    const created = await service.createReceipt({
      purchaseOrderId: 'po_1',
      locationId: 'loc_1',
      items: [{ purchaseItemId: 'pi_1', receivedQuantity: '150' }],
    })
    await expect(
      service.postReceipt({
        goodsReceiptId: created.receipt.id,
        idempotencyKey: 'idem-over',
        allowOverReceive: false,
      }),
    ).rejects.toThrow(/receive_exceeds/)
  })
})
