export type AnalyticsPeriodPreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_15_days'
  | 'last_30_days'
  | 'last_90_days'
  | 'this_month'
  | 'previous_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom'

export type AnalyticsDimension =
  | 'organization'
  | 'branch'
  | 'store'
  | 'seller'
  | 'customer'
  | 'product'
  | 'category'
  | 'brand'
  | 'supplier'
  | 'channel'
  | 'paymentMethod'
  | 'origin'
  | 'status'

export type AnalyticsUnit = 'money' | 'number' | 'percent' | 'quantity'
export type AnalyticsCategory =
  | 'overview'
  | 'commercial'
  | 'sellers'
  | 'products'
  | 'customers'
  | 'inventory'
  | 'finance'
  | 'comparatives'

export type AnalyticsTrend = 'up' | 'down' | 'flat' | 'unknown'

export type AnalyticsDateRange = {
  from: string
  to: string
}

export type AnalyticsFilters = Partial<Record<AnalyticsDimension, string[]>> & {
  period: AnalyticsPeriodPreset
  customRange?: AnalyticsDateRange
}

export type AnalyticsQuery = {
  organizationId: string
  filters: AnalyticsFilters
}

export type AnalyticsComparison = {
  previousValue: number | null
  variationPercent: number | null
  label: string
  trend: AnalyticsTrend
}

export type MetricDefinition = {
  id: string
  name: string
  description: string
  category: AnalyticsCategory
  unit: AnalyticsUnit
  origin: string[]
  formula: string
  filters: AnalyticsDimension[]
}

export type AnalyticsMetric = MetricDefinition & {
  value: number | null
  formattedValue: string
  updatedAt: string
  comparison: AnalyticsComparison
  status: 'ready' | 'insufficient_data'
  href: string
}

export type AnalyticsSeriesPoint = {
  label: string
  value: number
  comparisonValue?: number
}

export type AnalyticsTab = {
  id: AnalyticsCategory
  label: string
  description: string
  metricIds: string[]
}

export type AnalyticsDrilldown = {
  metricId: string
  title: string
  description: string
  rows: Array<Record<string, string | number>>
}

export type AnalyticsWorkspaceSnapshot = {
  generatedAt: string
  filters: AnalyticsFilters
  currentRange: AnalyticsDateRange
  previousRange: AnalyticsDateRange
  metrics: AnalyticsMetric[]
  tabs: AnalyticsTab[]
  series: Record<string, AnalyticsSeriesPoint[]>
  drilldowns: AnalyticsDrilldown[]
  sourceIssues: string[]
  performance: {
    mode: 'read_projection'
    scannedRows: number
    cacheTtlSeconds: number
  }
}

export type AnalyticsRecord = {
  id: string
  source: string
  date: string
  amount?: number
  quantity?: number
  discount?: number
  status?: string
  customerId?: string
  customerName?: string
  productId?: string
  productName?: string
  supplierId?: string
  supplierName?: string
  categoryId?: string
  brandId?: string
  sellerId?: string
  branchId?: string
  storeId?: string
  channel?: string
  paymentMethod?: string
  origin?: string
}

export type AnalyticsDataset = {
  generatedAt: string
  records: AnalyticsRecord[]
  sourceIssues: string[]
}
