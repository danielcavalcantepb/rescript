import type {
  AnalyticsDateRange,
  AnalyticsDimension,
  AnalyticsFilters,
  AnalyticsRecord,
} from './types'

const DAY = 24 * 60 * 60 * 1000

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY)
}

function toIso(date: Date): string {
  return date.toISOString()
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfQuarter(date: Date): Date {
  return new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1)
}

export function resolveAnalyticsRange(
  filters: AnalyticsFilters,
  now = new Date(),
): AnalyticsDateRange {
  const today = startOfDay(now)
  if (filters.period === 'custom' && filters.customRange) return filters.customRange
  if (filters.period === 'today') return { from: toIso(today), to: toIso(addDays(today, 1)) }
  if (filters.period === 'yesterday') return { from: toIso(addDays(today, -1)), to: toIso(today) }
  if (filters.period === 'last_7_days') return { from: toIso(addDays(today, -6)), to: toIso(addDays(today, 1)) }
  if (filters.period === 'last_15_days') return { from: toIso(addDays(today, -14)), to: toIso(addDays(today, 1)) }
  if (filters.period === 'last_30_days') return { from: toIso(addDays(today, -29)), to: toIso(addDays(today, 1)) }
  if (filters.period === 'last_90_days') return { from: toIso(addDays(today, -89)), to: toIso(addDays(today, 1)) }
  if (filters.period === 'this_month') return { from: toIso(startOfMonth(now)), to: toIso(addDays(today, 1)) }
  if (filters.period === 'previous_month') {
    const current = startOfMonth(now)
    return { from: toIso(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: toIso(current) }
  }
  if (filters.period === 'this_quarter') return { from: toIso(startOfQuarter(now)), to: toIso(addDays(today, 1)) }
  return { from: toIso(new Date(now.getFullYear(), 0, 1)), to: toIso(addDays(today, 1)) }
}

export function resolvePreviousRange(range: AnalyticsDateRange): AnalyticsDateRange {
  const from = new Date(range.from)
  const to = new Date(range.to)
  const duration = to.getTime() - from.getTime()
  return {
    from: new Date(from.getTime() - duration).toISOString(),
    to: from.toISOString(),
  }
}

function dimensionValue(record: AnalyticsRecord, dimension: AnalyticsDimension): string | undefined {
  if (dimension === 'organization') return undefined
  if (dimension === 'branch') return record.branchId
  if (dimension === 'store') return record.storeId
  if (dimension === 'seller') return record.sellerId
  if (dimension === 'customer') return record.customerId
  if (dimension === 'product') return record.productId
  if (dimension === 'category') return record.categoryId
  if (dimension === 'brand') return record.brandId
  if (dimension === 'supplier') return record.supplierId
  if (dimension === 'channel') return record.channel
  if (dimension === 'paymentMethod') return record.paymentMethod
  if (dimension === 'origin') return record.origin
  return record.status
}

export function filterRecords(
  records: AnalyticsRecord[],
  filters: AnalyticsFilters,
  range: AnalyticsDateRange,
): AnalyticsRecord[] {
  return records.filter((record) => {
    if (record.date < range.from || record.date >= range.to) return false
    return (Object.keys(filters) as Array<keyof AnalyticsFilters>)
      .filter((key) => key !== 'period' && key !== 'customRange' && key !== 'organization')
      .every((dimension) => {
        const selected = filters[dimension as AnalyticsDimension]
        if (!selected?.length) return true
        const value = dimensionValue(record, dimension as AnalyticsDimension)
        return value ? selected.includes(value) : false
      })
  })
}
