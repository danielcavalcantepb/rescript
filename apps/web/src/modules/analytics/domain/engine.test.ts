import { describe, expect, it } from 'vitest'
import { buildAnalyticsSnapshot } from './engine'
import type { AnalyticsDataset, AnalyticsFilters } from './types'

const filters: AnalyticsFilters = { period: 'last_30_days' }

const dataset: AnalyticsDataset = {
  generatedAt: '2026-07-27T12:00:00.000Z',
  sourceIssues: [],
  records: [
    {
      id: 'so_1',
      source: 'sales',
      date: '2026-07-26T10:00:00.000Z',
      amount: 1000,
      discount: 50,
      status: 'confirmed',
      customerId: 'cus_1',
      customerName: 'Ana Clara',
      origin: 'sales',
    },
    {
      id: 'so_2',
      source: 'sales',
      date: '2026-07-20T10:00:00.000Z',
      amount: 500,
      status: 'confirmed',
      customerId: 'cus_2',
      customerName: 'Bruno Lima',
      origin: 'sales',
    },
    {
      id: 'so_previous',
      source: 'sales',
      date: '2026-06-20T10:00:00.000Z',
      amount: 750,
      status: 'confirmed',
      customerId: 'cus_1',
      origin: 'sales',
    },
    {
      id: 'ar_1',
      source: 'receivables',
      date: '2026-07-26T10:00:00.000Z',
      amount: 600,
      status: 'open',
      customerId: 'cus_1',
      origin: 'receivable',
    },
    {
      id: 'ap_1',
      source: 'payables',
      date: '2026-07-26T10:00:00.000Z',
      amount: 200,
      status: 'approved',
      supplierId: 'sup_1',
      origin: 'payable',
    },
    {
      id: 'inv_1',
      source: 'inventory',
      date: '2026-07-27T12:00:00.000Z',
      quantity: 12,
      productId: 'prod_1',
      origin: 'inventory',
    },
  ],
}

describe('analytics engine', () => {
  it('calculates corporate KPIs and comparisons from read-only records', () => {
    const snapshot = buildAnalyticsSnapshot(dataset, filters)

    expect(snapshot.metrics.find((metric) => metric.id === 'revenue')?.value).toBe(1500)
    expect(snapshot.metrics.find((metric) => metric.id === 'orders')?.value).toBe(2)
    expect(snapshot.metrics.find((metric) => metric.id === 'average_ticket')?.value).toBe(750)
    expect(snapshot.metrics.find((metric) => metric.id === 'cash_flow')?.value).toBe(400)
    expect(snapshot.metrics.find((metric) => metric.id === 'revenue')?.comparison.trend).toBe('up')
  })

  it('declares insufficient data for metrics that require unavailable projections', () => {
    const snapshot = buildAnalyticsSnapshot(dataset, filters)

    expect(snapshot.metrics.find((metric) => metric.id === 'profit')?.status).toBe('insufficient_data')
    expect(snapshot.metrics.find((metric) => metric.id === 'stock_capital')?.formattedValue).toBe(
      'Dados insuficientes',
    )
  })

  it('applies simultaneous filters without changing the source dataset', () => {
    const snapshot = buildAnalyticsSnapshot(dataset, {
      period: 'last_30_days',
      customer: ['cus_1'],
      origin: ['sales'],
    })

    expect(snapshot.metrics.find((metric) => metric.id === 'revenue')?.value).toBe(1000)
    expect(dataset.records).toHaveLength(6)
  })

  it('keeps large-volume aggregation deterministic', () => {
    const records = Array.from({ length: 10_000 }, (_, index) => ({
      id: `so_${index}`,
      source: 'sales',
      date: '2026-07-26T10:00:00.000Z',
      amount: 1,
      status: 'confirmed',
      origin: 'sales',
    }))
    const snapshot = buildAnalyticsSnapshot({
      generatedAt: '2026-07-27T12:00:00.000Z',
      sourceIssues: [],
      records,
    }, filters)

    expect(snapshot.metrics.find((metric) => metric.id === 'revenue')?.value).toBe(10_000)
    expect(snapshot.performance.scannedRows).toBe(10_000)
  })
})
