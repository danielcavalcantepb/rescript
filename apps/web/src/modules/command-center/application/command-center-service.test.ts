import { describe, expect, it } from 'vitest'
import type { CommandCenterRawSnapshot } from '#/modules/command-center/domain/types'
import { createCommandCenterService } from './command-center-service'

const raw: CommandCenterRawSnapshot = {
  generatedAt: '2026-07-26T12:00:00.000Z',
  salesTodayValue: 100,
  salesTodayCount: 1,
  salesMonthValue: 100,
  salesMonthCount: 1,
  salesPreviousMonthValue: 0,
  quotationsOpenCount: 0,
  ordersPendingCount: 0,
  customersActiveCount: 1,
  customersNewMonthCount: 1,
  productsCount: 1,
  variantsCount: 1,
  inventoryOnHand: 1,
  inventoryReserved: 0,
  inventoryItemCount: 1,
  inventoryCriticalCount: 0,
  inventoryNegativeCount: 0,
  inventoryEstimatedValue: 0,
  receivablesOpenAmount: 0,
  receivablesPaidAmount: 0,
  receivablesOverdueAmount: 0,
  receivablesOverdueCount: 0,
  receivablesDueTodayAmount: 0,
  payablesOpenAmount: 0,
  payablesOverdueAmount: 0,
  payablesOverdueCount: 0,
  payablesDueTodayAmount: 0,
  paymentsMonthAmount: 0,
  sourceIssues: [],
}

describe('Command Center application service', () => {
  it('requires insights.view before loading operational data', async () => {
    const service = createCommandCenterService({
      can: () => false,
      read: {
        async loadRawSnapshot() {
          throw new Error('should_not_load')
        },
      },
    })

    await expect(service.getOverview()).rejects.toThrow('permission_denied')
  })

  it('returns a deterministic overview through the read port', async () => {
    const service = createCommandCenterService({
      can: (permission) => permission === 'insights.view',
      read: {
        async loadRawSnapshot() {
          return raw
        },
      },
    })

    await expect(service.getOverview()).resolves.toEqual(
      expect.objectContaining({
        generatedAt: raw.generatedAt,
        kpis: expect.arrayContaining([
          expect.objectContaining({ id: 'revenue-today' }),
        ]),
      }),
    )
  })
})
