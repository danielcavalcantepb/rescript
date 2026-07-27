import { describe, expect, it } from 'vitest'
import { buildCommandCenterSnapshot } from './rules'
import type { CommandCenterRawSnapshot } from './types'

const baseRaw: CommandCenterRawSnapshot = {
  generatedAt: '2026-07-26T12:00:00.000Z',
  salesTodayValue: 0,
  salesTodayCount: 0,
  salesMonthValue: 0,
  salesMonthCount: 0,
  salesPreviousMonthValue: 0,
  quotationsOpenCount: 0,
  ordersPendingCount: 0,
  customersActiveCount: 1,
  customersNewMonthCount: 1,
  productsCount: 1,
  variantsCount: 1,
  inventoryOnHand: 10,
  inventoryReserved: 2,
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

describe('Command Center rules', () => {
  it('creates a safe read-only operational snapshot without critical issues', () => {
    const snapshot = buildCommandCenterSnapshot({
      ...baseRaw,
      salesTodayValue: 1200,
      salesTodayCount: 2,
      salesMonthValue: 5200,
      salesMonthCount: 8,
      salesPreviousMonthValue: 4000,
    })

    expect(snapshot.kpis).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'revenue-today', value: 'R$ 1.200,00' }),
        expect.objectContaining({ id: 'forecast-flow', value: 'R$ 0,00' }),
      ]),
    )
    expect(snapshot.alerts).toHaveLength(0)
    expect(snapshot.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'all-clear', level: 'info' }),
      ]),
    )
  })

  it('prioritizes overdue payables and keeps the alert traceable to finance', () => {
    const snapshot = buildCommandCenterSnapshot({
      ...baseRaw,
      payablesOpenAmount: 1500,
      payablesOverdueAmount: 900,
      payablesOverdueCount: 2,
      payablesDueTodayAmount: 300,
    })

    expect(snapshot.priorities[0]).toEqual(
      expect.objectContaining({
        id: 'overdue-payables',
        level: 'critical',
        href: '/finance/accounts-payable',
      }),
    )
    expect(snapshot.alerts[0]).toEqual(
      expect.objectContaining({
        category: 'critical',
        origin: 'Accounts Payable',
      }),
    )
  })

  it('does not invent precision when operational data is missing', () => {
    const snapshot = buildCommandCenterSnapshot({
      ...baseRaw,
      customersActiveCount: 0,
      customersNewMonthCount: 0,
      productsCount: 0,
      variantsCount: 0,
      inventoryItemCount: 0,
      inventoryOnHand: 0,
      inventoryReserved: 0,
    })

    expect(snapshot.dataGaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'customers' }),
        expect.objectContaining({ id: 'products' }),
        expect.objectContaining({ id: 'sales-history' }),
      ]),
    )
    expect(snapshot.kpis).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'profit', value: 'Aguardando custo' }),
        expect.objectContaining({ id: 'stock-value', value: 'Aguardando custo' }),
      ]),
    )
  })
})
