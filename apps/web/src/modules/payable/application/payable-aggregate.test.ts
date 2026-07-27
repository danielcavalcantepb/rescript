import { describe, expect, it } from 'vitest'
import { createPayableService } from '#/modules/payable/application/payable-service'
import { createMemoryPayableRepos } from '#/modules/payable/application/memory-payable'
import { createInMemoryPayableEventCollector } from '#/modules/payable/domain/events'
import { splitEqualInstallments } from '#/modules/payable/domain/totals'
import type { PermissionKey } from '@rescript/permissions'

const ALL: PermissionKey[] = [
  'payable.read',
  'payable.create',
  'payable.edit',
  'payable.approve',
  'payable.cancel',
  'payable.archive',
  'payable.restore',
]

function seedOrigin() {
  return {
    goodsReceiptId: 'gr_1',
    supplier: {
      supplierId: 'sup_1',
      legalName: 'Fornecedor AP',
      document: '11444777000161',
      email: 'ap@test.com',
      phone: null,
    },
    purchase: { purchaseOrderId: 'po_1', purchaseNumber: 'PO-000001' },
    receiving: {
      goodsReceiptId: 'gr_1',
      goodsReceiptNumber: 'GR-000001',
      receivedAt: '2026-07-20T12:00:00.000Z',
    },
    currency: 'BRL',
    originalAmount: '100.0000',
  }
}

function app(grants: PermissionKey[] = ALL) {
  const repos = createMemoryPayableRepos({ origins: [seedOrigin()] })
  const events = createInMemoryPayableEventCollector()
  const service = createPayableService({
    organizationId: 'org_1',
    userId: 'user_1',
    can: (key) => grants.includes(key),
    clock: { nowIso: () => '2026-07-26T00:00:00.000Z' },
    ids: { next: () => 'id' },
    events,
    ...repos,
  })
  return { service, events, repos }
}

describe('Accounts Payable aggregate', () => {
  it('creates AP with snapshots, single/multi installments and lifecycle', async () => {
    const { service, events } = app()

    const single = await service.createPayable({ goodsReceiptId: 'gr_1' })
    expect(single.payable.number).toBe('AP-000001')
    expect(single.payable.supplierSnapshot.legalName).toBe('Fornecedor AP')
    expect(single.payable.receivingSnapshot.goodsReceiptNumber).toBe(
      'GR-000001',
    )
    expect(single.installments).toHaveLength(1)
    expect(single.payable.totals.openBalance).toBe('100.0000')

    await expect(
      service.createPayable({ goodsReceiptId: 'gr_1' }),
    ).rejects.toThrow(/conflict|Conflito/i)

    const repos = createMemoryPayableRepos({
      origins: [
        {
          ...seedOrigin(),
          goodsReceiptId: 'gr_2',
          receiving: {
            goodsReceiptId: 'gr_2',
            goodsReceiptNumber: 'GR-000002',
            receivedAt: '2026-07-21T00:00:00.000Z',
          },
        },
      ],
    })
    const multiService = createPayableService({
      organizationId: 'org_1',
      userId: 'u',
      can: () => true,
      clock: { nowIso: () => '2026-07-26T00:00:00.000Z' },
      ids: { next: () => crypto.randomUUID() },
      events: createInMemoryPayableEventCollector(),
      ...repos,
    })
    const parts = splitEqualInstallments('100.0000', 2, '2026-08-01')
    const multi = await multiService.createPayable({
      goodsReceiptId: 'gr_2',
      installments: parts,
    })
    expect(multi.installments).toHaveLength(2)
    expect(multi.installments[0]!.dueDate).toBe('2026-08-01')

    const approved = await service.approvePayable(single.payable.id)
    expect(approved.status).toBe('approved')
    await service.cancelPayable(single.payable.id, 'teste')
    await service.archivePayable(single.payable.id)
    const restored = await service.restorePayable(single.payable.id)
    expect(restored.status).toBe('cancelled')

    const search = await service.searchPayables({ q: 'AP-000001' })
    expect(search.some((x) => x.id === single.payable.id)).toBe(true)

    const drained = events.drain()
    expect(drained.some((e) => e.type === 'PayableCreated')).toBe(true)
    expect(drained.some((e) => e.type === 'InstallmentCreated')).toBe(true)
    expect(drained.some((e) => e.type === 'PayableApproved')).toBe(true)
  })

  it('enforces permissions', async () => {
    const { service } = app(['payable.read'])
    await expect(
      service.createPayable({ goodsReceiptId: 'gr_1' }),
    ).rejects.toThrow(/permission/)
  })

  it('rejects installment sum mismatch', async () => {
    const { service } = app()
    await expect(
      service.createPayable({
        goodsReceiptId: 'gr_1',
        installments: [
          { dueDate: '2026-08-01', amount: '40' },
          { dueDate: '2026-09-01', amount: '40' },
        ],
      }),
    ).rejects.toThrow(/validation/)
  })
})
