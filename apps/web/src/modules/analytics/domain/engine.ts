import { average, count, distinctCount, sum } from './aggregator'
import { compareMetric } from './comparator'
import { filterRecords, resolveAnalyticsRange, resolvePreviousRange } from './filter-engine'
import { formatMetricValue } from './formatter'
import { analyticsTabs, metricRegistry } from './metric-registry'
import type {
  AnalyticsDataset,
  AnalyticsDrilldown,
  AnalyticsFilters,
  AnalyticsMetric,
  AnalyticsRecord,
  AnalyticsSeriesPoint,
  AnalyticsWorkspaceSnapshot,
  MetricDefinition,
} from './types'

function hasSource(records: AnalyticsRecord[], source: string): boolean {
  return records.some((record) => record.source === source)
}

function bySource(records: AnalyticsRecord[], source: string): AnalyticsRecord[] {
  return records.filter((record) => record.source === source)
}

function metricValue(definition: MetricDefinition, records: AnalyticsRecord[]): number | null {
  const sales = bySource(records, 'sales')
  const receivables = bySource(records, 'receivables')
  const payables = bySource(records, 'payables')
  const inventory = bySource(records, 'inventory')
  const salesItems = bySource(records, 'sales_items')
  const customers = bySource(records, 'customers')

  if (definition.id === 'revenue') return sum(sales, 'amount')
  if (definition.id === 'orders') return count(sales)
  if (definition.id === 'average_ticket') return average(sum(sales, 'amount'), count(sales))
  if (definition.id === 'customers') {
    return distinctCount(sales, 'customerId') || count(customers)
  }
  if (definition.id === 'discount') return sum(sales, 'discount')
  if (definition.id === 'average_value') return average(sum(sales, 'amount'), count(sales))
  if (definition.id === 'stock') return sum(inventory, 'quantity')
  if (definition.id === 'receivable') return sum(receivables, 'amount')
  if (definition.id === 'payable') return sum(payables, 'amount')
  if (definition.id === 'cash_flow') return sum(receivables, 'amount') - sum(payables, 'amount')
  if (definition.id === 'products_sold') return hasSource(records, 'sales_items') ? distinctCount(salesItems, 'productId') : null
  if (definition.id === 'items_sold') return hasSource(records, 'sales_items') ? sum(salesItems, 'quantity') : null
  if (definition.id === 'profit' || definition.id === 'margin' || definition.id === 'stock_capital') return null
  return null
}

function buildMetric(
  definition: MetricDefinition,
  current: AnalyticsRecord[],
  previous: AnalyticsRecord[],
  updatedAt: string,
): AnalyticsMetric {
  const value = metricValue(definition, current)
  const previousValue = metricValue(definition, previous)
  return {
    ...definition,
    value,
    formattedValue: formatMetricValue(value, definition.unit),
    updatedAt,
    comparison: compareMetric(value, previousValue),
    status: value == null ? 'insufficient_data' : 'ready',
    href: `/analytics?metric=${definition.id}`,
  }
}

function makeSeries(records: AnalyticsRecord[]): AnalyticsSeriesPoint[] {
  const byDay = new Map<string, number>()
  for (const record of records) {
    const key = record.date.slice(0, 10)
    byDay.set(key, (byDay.get(key) ?? 0) + (record.amount ?? 0))
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }))
}

function buildDrilldowns(metrics: AnalyticsMetric[], records: AnalyticsRecord[]): AnalyticsDrilldown[] {
  const salesRows = bySource(records, 'sales').slice(0, 8).map((record) => ({
    data: record.date.slice(0, 10),
    cliente: record.customerName ?? 'Cliente não identificado',
    status: record.status ?? 'sem status',
    valor: record.amount ?? 0,
  }))
  return metrics.map((metric) => ({
    metricId: metric.id,
    title: metric.name,
    description: metric.description,
    rows: metric.category === 'commercial' || metric.id === 'revenue' ? salesRows : [],
  }))
}

export function buildAnalyticsSnapshot(
  dataset: AnalyticsDataset,
  filters: AnalyticsFilters,
  now = new Date(dataset.generatedAt),
): AnalyticsWorkspaceSnapshot {
  const currentRange = resolveAnalyticsRange(filters, now)
  const previousRange = resolvePreviousRange(currentRange)
  const current = filterRecords(dataset.records, filters, currentRange)
  const previous = filterRecords(dataset.records, filters, previousRange)
  const metrics = metricRegistry.map((definition) =>
    buildMetric(definition, current, previous, dataset.generatedAt),
  )

  return {
    generatedAt: dataset.generatedAt,
    filters,
    currentRange,
    previousRange,
    metrics,
    tabs: analyticsTabs,
    series: {
      revenue: makeSeries(bySource(current, 'sales')),
      cash_flow: makeSeries([
        ...bySource(current, 'receivables'),
        ...bySource(current, 'payables').map((record) => ({
          ...record,
          amount: -(record.amount ?? 0),
        })),
      ]),
    },
    drilldowns: buildDrilldowns(metrics, current),
    sourceIssues: dataset.sourceIssues,
    performance: {
      mode: 'read_projection',
      scannedRows: dataset.records.length,
      cacheTtlSeconds: 120,
    },
  }
}
